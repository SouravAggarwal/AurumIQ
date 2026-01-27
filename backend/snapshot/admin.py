"""
Django admin configuration for Snapshot models.
"""

from django.contrib import admin
from .models import Snapshot, SnapshotLeg


class SnapshotLegInline(admin.TabularInline):
    """Inline admin for SnapshotLeg within Snapshot."""
    model = SnapshotLeg
    extra = 1
    fields = ['ticker', 'date', 'price', 'quantity']


@admin.register(Snapshot)
class SnapshotAdmin(admin.ModelAdmin):
    """Admin configuration for Snapshot model."""
    list_display = ['snapshot_id', 'name', 'created_at', 'updated_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']
    ordering = ['-snapshot_id']
    inlines = [SnapshotLegInline]


@admin.register(SnapshotLeg)
class SnapshotLegAdmin(admin.ModelAdmin):
    """Admin configuration for SnapshotLeg model."""
    list_display = ['ticker', 'snapshot', 'date', 'price', 'quantity']
    search_fields = ['ticker']
    list_filter = ['date']
    ordering = ['-date']
