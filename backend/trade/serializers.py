"""
Serializers for Trade API endpoints.
"""

from rest_framework import serializers
from django.db import models
from decimal import Decimal
from .models import Trade, TradeLeg


class TradeLegSerializer(serializers.ModelSerializer):
    """Serializer for individual trade legs."""
    
    pnl = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    is_open = serializers.BooleanField(read_only=True)
    trade_id = serializers.ReadOnlyField(source='trade.trade_id')
    
    class Meta:
        model = TradeLeg
        fields = [
            'id', 'trade_id', 'ticker', 'entry_date', 'exit_date', 
            'entry_price', 'exit_price', 'quantity', 'pnl', 'is_open',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'trade_id', 'pnl', 'is_open', 'created_at', 'updated_at']


class TradeLegCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating trade legs (used within Trade create/update)."""
    
    class Meta:
        model = TradeLeg
        fields = [
            'ticker', 'entry_date', 'exit_date',
            'entry_price', 'exit_price', 'quantity'
        ]
    
    def validate(self, data):
        """Validate leg data."""
        # Check consistency of exit data
        exit_date = data.get('exit_date')
        exit_price = data.get('exit_price')
        
        if (exit_date and exit_price is None) or (exit_price is not None and not exit_date):
            raise serializers.ValidationError(
                "Both exit_date and exit_price must be provided for closed positions."
            )
        return data


class TradeSerializer(serializers.ModelSerializer):
    """
    Serializer for the Trade model including its legs.
    Used for Retrieve and List (detailed) operations.
    """
    # Since TradeLeg.trade_id is just an IntegerField, not a ForeignKey, we can't use 'source'. 
    # We will use a SerializerMethodField.
    
    legs = serializers.SerializerMethodField()
    is_open = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()
    leg_count = serializers.SerializerMethodField()
    tickers = serializers.SerializerMethodField()
    entry_date = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = [
            'trade_id', 'name', 'description', 'is_open', 'pnl', 
            'leg_count', 'tickers', 'entry_date', 'legs', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['trade_id', 'created_at', 'updated_at']

    def get_legs(self, obj):
        legs = TradeLeg.objects.filter(trade_id=obj.trade_id)
        return TradeLegSerializer(legs, many=True).data

    def get_is_open(self, obj):
        # A trade is open if ANY leg is open
        legs = TradeLeg.objects.filter(trade_id=obj.trade_id)
        return any(leg.is_open for leg in legs)

    def get_pnl(self, obj):
        legs = TradeLeg.objects.filter(trade_id=obj.trade_id)
        return sum(leg.pnl for leg in legs)

    def get_leg_count(self, obj):
        return TradeLeg.objects.filter(trade_id=obj.trade_id).count()

    def get_tickers(self, obj):
        legs = TradeLeg.objects.filter(trade_id=obj.trade_id)
        return list(legs.values_list('ticker', flat=True).distinct())

    def get_entry_date(self, obj):
        legs = TradeLeg.objects.filter(trade_id=obj.trade_id)
        if not legs:
            return None
        return min(leg.entry_date for leg in legs)


class TradeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new Trade and its legs."""
    legs = TradeLegCreateSerializer(many=True, min_length=1)
    
    class Meta:
        model = Trade
        fields = ['name', 'description', 'legs']
    
    def create(self, validated_data):
        legs_data = validated_data.pop('legs')
        
        # Generate new trade_id
        max_id = Trade.objects.aggregate(m=models.Max('trade_id'))['m'] or 0
        new_trade_id = max_id + 1
        
        trade = Trade.objects.create(trade_id=new_trade_id, **validated_data)
        
        for leg_data in legs_data:
            TradeLeg.objects.create(trade_id=new_trade_id, **leg_data)
            
        return trade


class TradeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Trade and its legs."""
    legs = serializers.ListField(child=serializers.DictField(), min_length=1)
    
    class Meta:
        model = Trade
        fields = ['name', 'description', 'legs']

    def update(self, instance, validated_data):
        # Update Trade fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        # Update Legs
        legs_data = validated_data.get('legs')
        if legs_data:
            existing_ids = set(TradeLeg.objects.filter(trade_id=instance.trade_id).values_list('id', flat=True))
            updated_ids = set()
            
            for leg_data in legs_data:
                leg_id = leg_data.get('id')
                
                # Transform to model fields if raw (e.g. from frontend form state)
                # But here we expect cleaner data.
                # Remove non-model fields
                clean_data = {
                    k: v for k, v in leg_data.items() 
                    if k in ['ticker', 'entry_date', 'exit_date', 'entry_price', 'exit_price', 'quantity']
                }

                if leg_id and leg_id in existing_ids:
                    TradeLeg.objects.filter(id=leg_id).update(**clean_data)
                    updated_ids.add(leg_id)
                else:
                    TradeLeg.objects.create(trade_id=instance.trade_id, **clean_data)
            
            # Delete removed legs
            legs_to_delete = existing_ids - updated_ids
            TradeLeg.objects.filter(id__in=legs_to_delete).delete()

        return instance
