"""
Serializers for Trade API endpoints.

Provides serialization for individual legs, grouped trades, and analytics.
"""

from rest_framework import serializers
from django.db.models import Sum, F, Case, When, Value, BooleanField
from decimal import Decimal
from .models import TradeLeg


class TradeLegSerializer(serializers.ModelSerializer):
    """Serializer for individual trade legs."""
    
    pnl = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = TradeLeg
        fields = [
            'id', 'trade_id', 'name', 'is_open', 'ticker',
            'entry_date', 'exit_date', 'entry_price', 'exit_price',
            'quantity', 'pnl', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pnl', 'created_at', 'updated_at']


class TradeLegCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating trade legs (without trade_id, which comes from parent)."""
    
    class Meta:
        model = TradeLeg
        fields = [
            'name', 'is_open', 'ticker', 'entry_date', 'exit_date',
            'entry_price', 'exit_price', 'quantity'
        ]
    
    def validate(self, data):
        """Validate leg data."""
        # If position is closed, exit_date and exit_price are required
        if not data.get('is_open', True):
            if not data.get('exit_date'):
                raise serializers.ValidationError({
                    'exit_date': 'Exit date is required for closed positions.'
                })
            if data.get('exit_price') is None:
                raise serializers.ValidationError({
                    'exit_price': 'Exit price is required for closed positions.'
                })
        return data


class TradeCreateSerializer(serializers.Serializer):
    """Serializer for creating a trade with multiple legs."""
    
    legs = TradeLegCreateSerializer(many=True, min_length=1)
    
    def validate_legs(self, legs):
        """Ensure at least one leg and consistent naming."""
        if not legs:
            raise serializers.ValidationError("At least one leg is required.")
        return legs
    
    def create(self, validated_data):
        """Create a new trade with all its legs."""
        legs_data = validated_data['legs']
        
        # Generate next trade_id
        max_trade_id = TradeLeg.objects.aggregate(
            max_id=models.Max('trade_id')
        )['max_id'] or 0
        new_trade_id = max_trade_id + 1
        
        # Create all legs with the same trade_id
        created_legs = []
        for leg_data in legs_data:
            leg = TradeLeg.objects.create(
                trade_id=new_trade_id,
                **leg_data
            )
            created_legs.append(leg)
        
        return created_legs


class TradeUpdateSerializer(serializers.Serializer):
    """Serializer for updating a trade and its legs."""
    
    legs = serializers.ListField(child=serializers.DictField(), min_length=1)
    
    def validate_legs(self, legs):
        """Validate each leg in the update."""
        for i, leg in enumerate(legs):
            # Check required fields for new legs
            if 'id' not in leg:
                required_fields = ['name', 'ticker', 'entry_date', 'entry_price', 'quantity']
                for field in required_fields:
                    if field not in leg:
                        raise serializers.ValidationError(
                            f"Leg {i+1}: '{field}' is required for new legs."
                        )
            
            # Validate closed position requirements
            if not leg.get('is_open', True):
                if not leg.get('exit_date'):
                    raise serializers.ValidationError(
                        f"Leg {i+1}: exit_date is required for closed positions."
                    )
                if leg.get('exit_price') is None:
                    raise serializers.ValidationError(
                        f"Leg {i+1}: exit_price is required for closed positions."
                    )
        return legs
    
    def update(self, trade_id, validated_data):
        """Update trade legs - add, update, or remove."""
        legs_data = validated_data['legs']
        existing_leg_ids = set(
            TradeLeg.objects.filter(trade_id=trade_id).values_list('id', flat=True)
        )
        updated_leg_ids = set()
        result_legs = []
        
        for leg_data in legs_data:
            leg_id = leg_data.pop('id', None)
            
            if leg_id and leg_id in existing_leg_ids:
                # Update existing leg
                TradeLeg.objects.filter(id=leg_id).update(**leg_data)
                updated_leg_ids.add(leg_id)
                result_legs.append(TradeLeg.objects.get(id=leg_id))
            else:
                # Create new leg
                leg = TradeLeg.objects.create(trade_id=trade_id, **leg_data)
                result_legs.append(leg)
        
        # Delete legs that were not included in the update
        legs_to_delete = existing_leg_ids - updated_leg_ids
        if legs_to_delete:
            TradeLeg.objects.filter(id__in=legs_to_delete).delete()
        
        return result_legs


class TradeListSerializer(serializers.Serializer):
    """
    Serializer for the trade list view.
    Shows aggregated data per trade_id.
    """
    
    trade_id = serializers.IntegerField()
    name = serializers.CharField()
    is_open = serializers.BooleanField()
    pnl = serializers.DecimalField(max_digits=12, decimal_places=2)
    leg_count = serializers.IntegerField()
    tickers = serializers.ListField(child=serializers.CharField())
    entry_date = serializers.DateField()


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


# Import models for the create serializer
from django.db import models
