"""
API views for Dashboard and Analytics.
"""

from rest_framework.response import Response
from rest_framework.views import APIView
from decimal import Decimal
from collections import defaultdict

from trade.models import Trade, TradeLeg
from .serializers import AnalyticsSummarySerializer


class AnalyticsView(APIView):
    """
    API view for analytics summary.
    """
    
    def get(self, request):
        all_trades = Trade.objects.all()
        all_legs = TradeLeg.objects.all()
        
        if not all_trades.exists():
            return Response({
                'total_open_trades': 0,
                'total_closed_trades': 0,
                'overall_pnl': '0.00',
                'open_trades_pnl': '0.00',
                'closed_trades_pnl': '0.00',
                'pnl_over_time': []
            })
        
        # Identify open and closed trades
        open_trade_ids = set()
        closed_trade_ids = set()
        
        # We need to map trade_id -> legs to determine status efficiently
        legs_by_trade = defaultdict(list)
        for leg in all_legs:
            legs_by_trade[leg.trade_id].append(leg)
            
        for trade in all_trades:
            legs = legs_by_trade.get(trade.trade_id, [])
            if not legs:
                # Treat trade with no legs as closed or maybe irrelevant? 
                # Let's count as closed for now with 0 pnl.
                closed_trade_ids.add(trade.trade_id)
                continue
                
            is_open = any(leg.is_open for leg in legs)
            if is_open:
                open_trade_ids.add(trade.trade_id)
            else:
                closed_trade_ids.add(trade.trade_id)
                
        # Helper to sum pnl
        def sum_pnl(legs_subset):
            return sum(leg.pnl for leg in legs_subset)
            
        overall_pnl = sum_pnl(all_legs)
        
        # PnL from open trades (sum of pnl of their legs that are closed? or all legs?)
        # Usually "PnL of open trades" means realized pnl of closed legs within open trades.
        # "Unrealized" is separate.
        open_trades_legs = [leg for leg in all_legs if leg.trade_id in open_trade_ids]
        open_trades_pnl = sum_pnl(open_trades_legs)
        
        closed_trades_legs = [leg for leg in all_legs if leg.trade_id in closed_trade_ids]
        closed_trades_pnl = sum_pnl(closed_trades_legs)
        
        # PnL over time (by exit date of legs)
        pnl_by_month = defaultdict(Decimal)
        for leg in all_legs:
            if not leg.is_open and leg.exit_date:
                month_key = leg.exit_date.strftime('%Y-%m')
                pnl_by_month[month_key] += leg.pnl
                
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
        
        return Response(response_data)
