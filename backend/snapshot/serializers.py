"""
Serializers for Snapshot API endpoints.
"""

from rest_framework import serializers
from django.db import models
from .models import Snapshot, SnapshotLeg


class SnapshotLegCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating snapshot legs (used within Snapshot create/update)."""
    
    class Meta:
        model = SnapshotLeg
        fields = [
            'ticker', 'date', 'price', 'quantity'
        ]
    
    def validate(self, data):
        """Validate leg data."""
        # Ensure all required fields are present
        if not data.get('ticker'):
            raise serializers.ValidationError("Ticker is required.")
        if not data.get('date'):
            raise serializers.ValidationError("Date is required.")
        if data.get('price') is None:
            raise serializers.ValidationError("Price is required.")
        if data.get('quantity') is None:
            raise serializers.ValidationError("Quantity is required.")
        return data


class SnapshotCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new Snapshot and its legs."""
    legs = SnapshotLegCreateSerializer(many=True, min_length=1)
    
    class Meta:
        model = Snapshot
        fields = ['name', 'description', 'legs']
    
    def create(self, validated_data):
        legs_data = validated_data.pop('legs')
        
        # Generate new snapshot_id
        max_id = Snapshot.objects.aggregate(m=models.Max('snapshot_id'))['m'] or 0
        new_snapshot_id = max_id + 1
        
        snapshot = Snapshot.objects.create(snapshot_id=new_snapshot_id, **validated_data)
        
        for leg_data in legs_data:
            SnapshotLeg.objects.create(snapshot_id=new_snapshot_id, **leg_data)
            
        return snapshot


class SnapshotUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Snapshot and its legs."""
    legs = serializers.ListField(child=serializers.DictField(), min_length=1)
    
    class Meta:
        model = Snapshot
        fields = ['name', 'description', 'legs']

    def update(self, instance, validated_data):
        # Update Snapshot fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        # Update Legs
        legs_data = validated_data.get('legs')
        if legs_data:
            existing_ids = set(SnapshotLeg.objects.filter(snapshot_id=instance.snapshot_id).values_list('id', flat=True))
            updated_ids = set()
            
            for leg_data in legs_data:
                leg_id = leg_data.get('id')
                
                # Only keep model fields
                clean_data = {
                    k: v for k, v in leg_data.items() 
                    if k in ['ticker', 'date', 'price', 'quantity']
                }

                if leg_id and leg_id in existing_ids:
                    SnapshotLeg.objects.filter(id=leg_id).update(**clean_data)
                    updated_ids.add(leg_id)
                else:
                    SnapshotLeg.objects.create(snapshot_id=instance.snapshot_id, **clean_data)
            
            # Delete removed legs
            legs_to_delete = existing_ids - updated_ids
            SnapshotLeg.objects.filter(id__in=legs_to_delete).delete()

        return instance
