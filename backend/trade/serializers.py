"""
Serializers for Trade API endpoints.
"""

from rest_framework import serializers
from django.db import models
from .models import Trade, TradeLeg


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
        exit_date = data.get('exit_date')
        exit_price = data.get('exit_price')
        
        if (exit_date and exit_price is None) or (exit_price is not None and not exit_date):
            raise serializers.ValidationError(
                "Both exit_date and exit_price must be provided for closed positions."
            )
        return data


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
                
                # Only keep model fields
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
