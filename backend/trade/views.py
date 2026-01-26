from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Max, Min
from decimal import Decimal
from collections import defaultdict
from brokers.fyers.fyers_master_client import get_fyers_master_client
from brokers.fyers.fyers_client import get_fyers_client
from datetime import datetime

from django.shortcuts import get_object_or_404
from .models import Trade, TradeLeg
from .serializers import (
    TradeCreateSerializer,
    TradeUpdateSerializer,
)

class TradeViewSet(viewsets.ViewSet):
    """
    ViewSet for Trade CRUD operations.
    """
    DATE_FORMAT = "%Y-%m-%d"

    def _build_trade_response(self, trade):
        """
        Helper method to construct the trade response dictionary manually.
        """
        legs = TradeLeg.objects.filter(trade_id=trade.trade_id)
        
        # Build legs data
        legs_data = []
        for leg in legs:
            legs_data.append({
                'id': leg.id,
                'trade_id': leg.trade_id,
                'ticker': leg.ticker,
                'entry_date': leg.entry_date.strftime(self.DATE_FORMAT) if leg.entry_date else None,
                'entry_price': leg.entry_price if leg.entry_price is not None else None,
                'exit_date': leg.exit_date.strftime(self.DATE_FORMAT) if leg.exit_date else None,
                'exit_price': leg.exit_price if leg.exit_price is not None else None,
                'quantity': leg.quantity,
                'ltp': None,
                'spread': None,
                'pnl': None,
                'pnl_percentage': None,
                'days_left_for_expiry': None,
                'expiry_date': None,
                'is_open': leg.is_open,
                'created_at': leg.created_at,
                'updated_at': leg.updated_at
            })

        # Calculate derived fields
        is_open = any(leg.is_open for leg in legs)
        pnl = sum(leg.pnl for leg in legs)
        leg_count = legs.count()
        tickers = list(legs.values_list('ticker', flat=True).distinct())
        
        entry_dates = [leg.entry_date for leg in legs if leg.entry_date]
        entry_date = min(entry_dates) if entry_dates else None

        return {
            'trade_id': trade.trade_id,
            'name': trade.name,
            'description': trade.description,
            'is_open': is_open,
            'pnl': str(pnl),
            'leg_count': leg_count,
            'tickers': tickers,
            'entry_date': entry_date,
            'legs': legs_data,
            'created_at': trade.created_at,
            'updated_at': trade.updated_at
        }

    def list(self, request):
        """Get all trades (Structured for frontend pagination)."""
        queryset = Trade.objects.all().order_by('-trade_id')
        
        # Get pagination parameters from request
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
        except (TypeError, ValueError):
            page = 1
            page_size = 10
            
        start = (page - 1) * page_size
        end = start + page_size
        
        count = queryset.count()
        paged_queryset = queryset[start:end]
        
        results = [self._build_trade_response(trade) for trade in paged_queryset]

        # Update Derived Fields
        results = self._update_pnl_for_closed_legs(results)

        return Response({
            'count': count,
            'results': results
        })

    def create(self, request):
        """Create a new trade."""
        serializer = TradeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trade = serializer.save()
        
        # Return the detailed trade view
        return Response(self._build_trade_response(trade), status=status.HTTP_201_CREATED)

    def getTradesByTradeId(self, request, trade_id=None):
        try:
            trade = get_object_or_404(Trade, trade_id=trade_id)
            response = self._build_trade_response(trade)

            # Update Derived Fields from Fyers Quotes and Master Data
            self._update_derived_fields(response)
            return Response(response)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def update(self, request, trade_id=None):
        """Update an existing trade."""
        trade = get_object_or_404(Trade, trade_id=trade_id)

        # We use TradeUpdateSerializer for processing the input
        serializer = TradeUpdateSerializer(trade, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_trade = serializer.save()
        
        # Return the final detailed view
        return Response(self._build_trade_response(updated_trade))

    def partial_update(self, request, trade_id=None):
        """Partial update an existing trade."""
        return self.update(request, trade_id)

    def destroy(self, request, trade_id=None):
        """Delete a trade and its associated legs."""
        trade = get_object_or_404(Trade, trade_id=trade_id)
        # Delete associated legs first
        TradeLeg.objects.filter(trade_id=trade.trade_id).delete()
        trade.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _update_pnl_for_closed_legs(self, results):
        # Calculate PnL for Closed Legs
        for trade in results:
            trade_pnl = 0
            for leg in trade['legs']:
                if (leg['is_open'] == False 
                and leg['exit_price'] > 0
                and leg['entry_price'] > 0
                and leg['quantity'] is not None):
                    trade_pnl += (leg['exit_price'] - leg['entry_price']) * leg['quantity']
            trade['pnl'] = trade_pnl
        return results

    def _update_derived_fields(self, response):
        tickers = list(set([leg['ticker'] for leg in response['legs'] if leg['ticker']]))
        
        # Fetch Fyers Live Quotes
        live_quotes = get_fyers_client().get_quotes(tickers)

        # Fetch Fyers Master Data
        master_data = get_fyers_master_client().get_symbol_master_details(tickers)

        for leg in response['legs']:
            # Update Fyers Master Data
            if leg['ticker'] in master_data:
                if (master_data[leg['ticker']].get('expiry_epoch_dup', '').isdigit()):
                    dt_utc = datetime.utcfromtimestamp(int(master_data[leg['ticker']]['expiry_epoch_dup']))
                    leg['expiry_date'] = dt_utc.strftime(self.DATE_FORMAT)
                    leg['days_left_for_expiry'] = (dt_utc - datetime.now()).days - 1

            # Update Fyers Live Quotes Data
            if leg['ticker'] in live_quotes:
                leg['ltp'] = live_quotes[leg['ticker']].get('ltp')
                leg['spread'] = live_quotes[leg['ticker']].get('spread')

            # Calculate PnL for Legs
            if (leg['entry_price'] > 0 and leg['quantity'] is not None):
                if (leg['is_open'] and leg['ltp'] is not None and leg['ltp'] > 0):
                    leg['pnl'] = (leg['ltp'] - leg['entry_price']) * leg['quantity']
                    leg['pnl_percentage'] = ((leg['ltp'] - leg['entry_price']) / leg['entry_price']) * 100 * leg['quantity']
                elif (not leg['is_open'] and leg['exit_price'] is not None and leg['exit_price'] > 0):
                    leg['pnl'] = (leg['exit_price'] - leg['entry_price']) * leg['quantity']
                    leg['pnl_percentage'] = ((leg['exit_price'] - leg['entry_price']) / leg['entry_price']) * 100 * leg['quantity']

        response['pnl'] = sum([leg['pnl'] for leg in response['legs'] if leg['pnl'] is not None])
        return response