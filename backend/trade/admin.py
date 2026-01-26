from django.contrib import admin
from .models import Trade, TradeLeg

@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ('trade_id', 'name', 'created_at')
    search_fields = ('name', 'description')

@admin.register(TradeLeg)
class TradeLegAdmin(admin.ModelAdmin):
    list_display = ('trade', 'ticker', 'entry_date', 'is_open', 'pnl')
    list_filter = ('entry_date', 'exit_date', 'ticker')
    search_fields = ('ticker', 'trade__name')
