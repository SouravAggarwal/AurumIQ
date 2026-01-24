"""
Serializers for Dashboard API endpoints.
"""

from rest_framework import serializers

class AnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for analytics summary data."""
    
    total_open_trades = serializers.IntegerField()
    total_closed_trades = serializers.IntegerField()
    overall_pnl = serializers.DecimalField(max_digits=14, decimal_places=2)
    open_trades_pnl = serializers.DecimalField(max_digits=14, decimal_places=2)
    closed_trades_pnl = serializers.DecimalField(max_digits=14, decimal_places=2)
    pnl_over_time = serializers.ListField(
        child=serializers.DictField()
    )
