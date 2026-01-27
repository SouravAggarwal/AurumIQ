from django.contrib import admin
from .models import FyersMasterData

@admin.register(FyersMasterData)
class FyersMasterDataAdmin(admin.ModelAdmin):
    list_display = ('exchange_symbol', 'underlying_symbol', 'expiry_epoch', 'symbol_details', 'updated_at')
    search_fields = ('exchange_symbol', 'underlying_symbol', 'symbol_details')
    list_filter = ('underlying_symbol',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-updated_at',)
