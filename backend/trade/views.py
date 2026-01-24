"""
API views for Trade management.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Max, Min
from decimal import Decimal
from collections import defaultdict

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
    
    def _build_trade_response(self, trade):
        """
        Helper method to construct the trade response dictionary manually.
        Includes all fields previously handled by TradeSerializer.
        """
        legs = TradeLeg.objects.filter(trade_id=trade.trade_id)
        
        # Calculate derived fields
        is_open = any(leg.is_open for leg in legs)
        pnl = sum(leg.pnl for leg in legs)
        leg_count = legs.count()
        tickers = list(legs.values_list('ticker', flat=True).distinct())
        
        entry_dates = [leg.entry_date for leg in legs if leg.entry_date]
        entry_date = min(entry_dates) if entry_dates else None

        # Build legs data
        legs_data = []
        for leg in legs:
            legs_data.append({
                'id': leg.id,
                'trade_id': leg.trade_id,
                'ticker': leg.ticker,
                'entry_date': leg.entry_date,
                'exit_date': leg.exit_date,
                'entry_price': str(leg.entry_price) if leg.entry_price is not None else None,
                'exit_price': str(leg.exit_price) if leg.exit_price is not None else None,
                'quantity': leg.quantity,
                'pnl': str(leg.pnl),
                'is_open': leg.is_open,
                'created_at': leg.created_at,
                'updated_at': leg.updated_at
            })

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
        """Get a specific trade by trade_id."""
        trade = get_object_or_404(Trade, trade_id=trade_id)
        response = self._build_trade_response(trade)

        for leg in response['legs']:
            print(leg)
            if (leg['is_open'] and (not leg['exit_price'])):
                print("Leg is closed and exit price is not set")
                leg['pnl'] = "002"
        return Response(response)

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


class LivePricesView(APIView):
    """
    API view for fetching live prices for open trades.
    """
    
    def get(self, request):
        # Import from brokers app dynamically to avoid circular issues during startup if any, 
        # though standard import is fine.
        from brokers.services.fyers_client import get_fyers_client, FyersClientError
        
        # Fetch status of all trades to find open ones
        # A bit inefficient to fetch all, but cleaner logic. 
        # Optimized: Get all legs where exit_price is null
        open_legs_db = TradeLeg.objects.filter(exit_price__isnull=True)
        if not open_legs_db.exists():
             return Response({
                'fyers_configured': False,
                'prices': {},
                'open_trades': [],
                'total_unrealized_pnl': '0.00'
            })
            
        trade_ids = list(open_legs_db.values_list('trade_id', flat=True).distinct())
        
        # Get Trades
        trades = Trade.objects.filter(trade_id__in=trade_ids)
        
        # Get all legs for these trades (some might be closed)
        all_legs_for_trades = TradeLeg.objects.filter(trade_id__in=trade_ids)
        
        tickers = list(open_legs_db.values_list('ticker', flat=True).distinct())
        
        # Try to fetch live prices
        live_prices = {}
        fyers_configured = False
        fyers_error = None
        
        try:
            fyers_client = get_fyers_client()
            if fyers_client.is_configured:
                fyers_configured = True
                live_prices = fyers_client.get_quotes(tickers)
        except Exception as e:
            fyers_error = str(e)
            
        open_trades_data = []
        total_pnl = Decimal('0.00')
        
        legs_map = defaultdict(list)
        for leg in all_legs_for_trades:
            legs_map[leg.trade_id].append(leg)
            
        for trade in trades:
            legs = legs_map[trade.trade_id]
            trade_pnl = Decimal('0.00')
            legs_data = []
            
            for leg in legs:
                if leg.is_open:
                    # Calculate unrealized
                    ticker_data = live_prices.get(leg.ticker, {})
                    ltp = ticker_data.get('ltp')
                    
                    unrealized = None
                    if ltp:
                        unrealized = (Decimal(str(ltp)) - leg.entry_price) * leg.quantity
                        trade_pnl += unrealized
                    
                    legs_data.append({
                        'id': leg.id,
                        'ticker': leg.ticker,
                        'entry_price': str(leg.entry_price),
                        'current_price': ltp,
                        'quantity': leg.quantity,
                        'unrealized_pnl': str(unrealized) if unrealized else None,
                        'is_open': True
                    })
                else:
                    # Closed leg
                    legs_data.append({
                        'id': leg.id,
                        'ticker': leg.ticker,
                        'is_open': False,
                        'pnl': str(leg.pnl)
                    })
            
            total_pnl += trade_pnl
            
            open_trades_data.append({
                'trade_id': trade.trade_id,
                'name': trade.name,
                'legs': legs_data,
                'total_unrealized_pnl': str(trade_pnl)
            })
            
        return Response({
            'fyers_configured': fyers_configured,
            'fyers_error': fyers_error,
            'open_trades': open_trades_data,
            'total_unrealized_pnl': str(total_pnl)
        })
