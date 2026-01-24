"""
API views for Trade management and Analytics.

Provides RESTful endpoints for CRUD operations on trades and analytics summary.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import (
    Sum, Count, F, Case, When, Value, BooleanField,
    Max, Min, DecimalField, Subquery, OuterRef
)
from django.db.models.functions import Coalesce, TruncMonth
from django.db import models
from decimal import Decimal
from collections import defaultdict

from .models import TradeLeg
from .serializers import (
    TradeLegSerializer,
    TradeCreateSerializer,
    TradeUpdateSerializer,
    TradeListSerializer,
    AnalyticsSummarySerializer,
)


class TradeViewSet(viewsets.ViewSet):
    """
    ViewSet for Trade CRUD operations.
    
    Trades are grouped by trade_id, with each trade potentially having multiple legs.
    """
    
    def list(self, request):
        """
        List all trades grouped by trade_id with aggregated data.
        
        Returns paginated list of trades with:
        - trade_id
        - name (from first leg)
        - is_open (true if any leg is open)
        - pnl (sum of all closed leg PnLs)
        - leg_count
        - tickers (unique list)
        - entry_date (earliest entry date)
        """
        # Get pagination parameters
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        # Get all unique trade_ids with aggregated data
        trade_ids = TradeLeg.objects.values('trade_id').distinct().order_by('-trade_id')
        
        # Paginate
        total_count = trade_ids.count()
        start = (page - 1) * page_size
        end = start + page_size
        paginated_trade_ids = list(trade_ids[start:end].values_list('trade_id', flat=True))
        
        # Build response data for each trade
        trades_data = []
        for trade_id in paginated_trade_ids:
            legs = TradeLeg.objects.filter(trade_id=trade_id)
            
            # Get first leg for name
            first_leg = legs.first()
            
            # Calculate aggregates
            is_open = legs.filter(is_open=True).exists()
            
            # Calculate PnL for closed legs
            closed_legs = legs.filter(is_open=False, exit_price__isnull=False)
            pnl = sum(
                (leg.exit_price - leg.entry_price) * leg.quantity
                for leg in closed_legs
            )
            
            # Get unique tickers
            tickers = list(legs.values_list('ticker', flat=True).distinct())
            
            # Get earliest entry date
            entry_date = legs.aggregate(min_date=Min('entry_date'))['min_date']
            
            trades_data.append({
                'trade_id': trade_id,
                'name': first_leg.name if first_leg else '',
                'is_open': is_open,
                'pnl': pnl,
                'leg_count': legs.count(),
                'tickers': tickers,
                'entry_date': entry_date,
            })
        
        serializer = TradeListSerializer(trades_data, many=True)
        
        return Response({
            'count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size,
            'current_page': page,
            'page_size': page_size,
            'results': serializer.data
        })
    
    def create(self, request):
        """
        Create a new trade with one or more legs.
        
        Request body should contain:
        {
            "legs": [
                {
                    "name": "Trade Name",
                    "is_open": true,
                    "ticker": "AAPL",
                    "entry_date": "2025-01-15",
                    "entry_price": 150.00,
                    "quantity": 100
                }
            ]
        }
        """
        serializer = TradeCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        legs = serializer.create(serializer.validated_data)
        trade_id = legs[0].trade_id
        
        return Response({
            'trade_id': trade_id,
            'message': f'Trade created with {len(legs)} leg(s)',
            'legs': TradeLegSerializer(legs, many=True).data
        }, status=status.HTTP_201_CREATED)
    

    def retrieveTradesByTradeId(self, request, trade_id=None):
        """
        Retrieve a single trade with all its legs.
        
        pk should be the trade_id.
        """
        try:
            trade_id_int = int(trade_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid trade_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        legs = TradeLeg.objects.filter(trade_id=trade_id_int)
        
        if not legs.exists():
            return Response(
                {'error': 'Trade not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate trade-level data
        is_open = legs.filter(is_open=True).exists()
        closed_legs = legs.filter(is_open=False, exit_price__isnull=False)
        pnl = sum(
            (leg.exit_price - leg.entry_price) * leg.quantity
            for leg in closed_legs
        )
        
        first_leg = legs.first()
        
        return Response({
            'trade_id': trade_id_int,
            'name': first_leg.name if first_leg else '',
            'is_open': is_open,
            'pnl': str(pnl),
            'legs': TradeLegSerializer(legs, many=True).data
        })

    def update(self, request, pk=None):
        """
        Update an existing trade and its legs.
        
        Legs with 'id' field will be updated.
        Legs without 'id' will be created.
        Existing legs not in the request will be deleted.
        """
        try:
            trade_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid trade_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check trade exists
        if not TradeLeg.objects.filter(trade_id=trade_id).exists():
            return Response(
                {'error': 'Trade not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TradeUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        legs = serializer.update(trade_id, serializer.validated_data)
        
        return Response({
            'trade_id': trade_id,
            'message': f'Trade updated with {len(legs)} leg(s)',
            'legs': TradeLegSerializer(legs, many=True).data
        })
    
    def destroy(self, request, pk=None):
        """Delete a trade and all its legs."""
        try:
            trade_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid trade_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        legs_deleted, _ = TradeLeg.objects.filter(trade_id=trade_id).delete()
        
        if legs_deleted == 0:
            return Response(
                {'error': 'Trade not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'message': f'Trade {trade_id} deleted ({legs_deleted} leg(s) removed)'
        }, status=status.HTTP_200_OK)


class AnalyticsView(APIView):
    """
    API view for analytics summary.
    
    Provides aggregated statistics about all trades.
    """
    
    def get(self, request):
        """
        Get analytics summary.
        
        Returns:
        - total_open_trades: Count of trades with any open leg
        - total_closed_trades: Count of fully closed trades
        - overall_pnl: Total PnL from all closed legs
        - open_trades_pnl: PnL from trades that are still open (closed legs only)
        - closed_trades_pnl: PnL from fully closed trades
        - pnl_over_time: Monthly PnL data for charting
        """
        all_legs = TradeLeg.objects.all()
        
        if not all_legs.exists():
            return Response({
                'total_open_trades': 0,
                'total_closed_trades': 0,
                'overall_pnl': '0.00',
                'open_trades_pnl': '0.00',
                'closed_trades_pnl': '0.00',
                'pnl_over_time': []
            })
        
        # Get trade IDs grouped by open/closed status
        trade_ids = all_legs.values('trade_id').distinct()
        
        open_trade_ids = set()
        closed_trade_ids = set()
        
        for trade_data in trade_ids:
            tid = trade_data['trade_id']
            has_open_legs = all_legs.filter(trade_id=tid, is_open=True).exists()
            if has_open_legs:
                open_trade_ids.add(tid)
            else:
                closed_trade_ids.add(tid)
        
        # Calculate overall PnL from closed legs
        def calculate_pnl(legs):
            return sum(
                (leg.exit_price - leg.entry_price) * leg.quantity
                for leg in legs.filter(is_open=False, exit_price__isnull=False)
            )
        
        overall_pnl = calculate_pnl(all_legs)
        
        # PnL from open trades (their closed legs)
        open_trades_pnl = calculate_pnl(
            all_legs.filter(trade_id__in=open_trade_ids)
        )
        
        # PnL from closed trades
        closed_trades_pnl = calculate_pnl(
            all_legs.filter(trade_id__in=closed_trade_ids)
        )
        
        # Calculate PnL over time (by exit month)
        closed_legs = all_legs.filter(
            is_open=False, 
            exit_price__isnull=False,
            exit_date__isnull=False
        )
        
        pnl_by_month = defaultdict(Decimal)
        for leg in closed_legs:
            month_key = leg.exit_date.strftime('%Y-%m')
            leg_pnl = (leg.exit_price - leg.entry_price) * leg.quantity
            pnl_by_month[month_key] += leg_pnl
        
        # Sort by month and format
        pnl_over_time = [
            {'date': month, 'pnl': str(pnl)}
            for month, pnl in sorted(pnl_by_month.items())
        ]
        
        response_data = {
            'total_open_trades': len(open_trade_ids),
            'total_closed_trades': len(closed_trade_ids),
            'overall_pnl': str(overall_pnl),
            'open_trades_pnl': str(open_trades_pnl),
            'closed_trades_pnl': str(closed_trades_pnl),
            'pnl_over_time': pnl_over_time
        }
        
        serializer = AnalyticsSummarySerializer(response_data)
        return Response(serializer.data)


class LivePricesView(APIView):
    """
    API view for fetching live prices for open trades.
    
    Uses Fyers API to get real-time market prices and calculates
    unrealized PnL for open positions.
    """
    
    def get(self, request):
        """
        Get live prices and unrealized PnL for all open trades.
        
        Returns:
        - prices: Dict of current market prices by ticker
        - open_trades: List of open trades with unrealized PnL
        - fyers_configured: Whether Fyers API is configured
        """
        from .services.fyers_client import get_fyers_client, FyersClientError
        
        # Get all open trade legs
        open_legs = TradeLeg.objects.filter(is_open=True)
        
        if not open_legs.exists():
            return Response({
                'fyers_configured': False,
                'prices': {},
                'open_trades': [],
                'total_unrealized_pnl': '0.00'
            })
        
        # Get unique tickers from open legs
        tickers = list(open_legs.values_list('ticker', flat=True).distinct())
        
        # Try to fetch live prices from Fyers
        live_prices = {}
        fyers_configured = False
        fyers_error = None
        
        try:
            fyers_client = get_fyers_client()
            if fyers_client.is_configured:
                fyers_configured = True
                live_prices = fyers_client.get_quotes(tickers)
        except FyersClientError as e:
            fyers_error = str(e)
        except Exception as e:
            fyers_error = f"Unexpected error: {e}"
        
        # Group legs by trade_id
        trade_ids = open_legs.values_list('trade_id', flat=True).distinct()
        
        open_trades = []
        total_unrealized_pnl = Decimal('0.00')
        
        for trade_id in trade_ids:
            legs = TradeLeg.objects.filter(trade_id=trade_id)
            first_leg = legs.first()
            
            trade_legs_data = []
            trade_unrealized_pnl = Decimal('0.00')
            
            for leg in legs.filter(is_open=True):
                # Get live price for this ticker
                ticker_data = live_prices.get(leg.ticker, {})
                current_price = ticker_data.get('ltp')
                
                # Calculate unrealized PnL if we have a live price
                unrealized_pnl = None
                if current_price is not None:
                    unrealized_pnl = (Decimal(str(current_price)) - leg.entry_price) * leg.quantity
                    trade_unrealized_pnl += unrealized_pnl
                
                trade_legs_data.append({
                    'id': leg.id,
                    'ticker': leg.ticker,
                    'entry_price': str(leg.entry_price),
                    'current_price': current_price,
                    'quantity': leg.quantity,
                    'entry_date': leg.entry_date.isoformat() if leg.entry_date else None,
                    'unrealized_pnl': str(unrealized_pnl) if unrealized_pnl is not None else None,
                    'price_change': ticker_data.get('change'),
                    'price_change_percent': ticker_data.get('change_percent'),
                })
            
            total_unrealized_pnl += trade_unrealized_pnl
            
            open_trades.append({
                'trade_id': trade_id,
                'name': first_leg.name if first_leg else '',
                'legs': trade_legs_data,
                'total_unrealized_pnl': str(trade_unrealized_pnl) if trade_legs_data else '0.00',
            })
        
        response_data = {
            'fyers_configured': fyers_configured,
            'fyers_error': fyers_error,
            'prices': {
                ticker: {
                    'ltp': data.get('ltp'),
                    'change': data.get('change'),
                    'change_percent': data.get('change_percent'),
                }
                for ticker, data in live_prices.items()
            },
            'open_trades': open_trades,
            'total_unrealized_pnl': str(total_unrealized_pnl),
        }
        
        return Response(response_data)
