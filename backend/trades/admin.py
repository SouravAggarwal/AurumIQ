from django.contrib import admin
from .models import TradeLeg


@admin.register(TradeLeg)
class TradeLegAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'trade_id', 'name', 'ticker', 'is_open',
        'entry_date', 'exit_date', 'quantity', 'display_pnl'
    ]
    list_filter = ['is_open', 'ticker', 'entry_date']
    search_fields = ['name', 'ticker']
    ordering = ['-trade_id', '-entry_date']
    
    def display_pnl(self, obj):
        try:
            return f"${obj.pnl:,.2f}"
        except Exception:
            return "Error"
    display_pnl.short_description = 'PnL'
