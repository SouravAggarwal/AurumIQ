from django.db import models


class FyersMasterData(models.Model):
    """Caches Fyers MCX instrument master data."""
    exchange_symbol = models.CharField(max_length=100, unique=True, db_index=True)
    underlying_symbol = models.CharField(max_length=50, db_index=True)
    expiry_epoch = models.BigIntegerField(null=True, blank=True)
    expiry_epoch_dup = models.CharField(max_length=50, null=True, blank=True)
    symbol_details = models.CharField(max_length=255, null=True, blank=True)
    
    # Store the full instrument record as JSON for compatibility with existing code
    raw_data = models.JSONField() 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fyers Master Data"
        verbose_name_plural = "Fyers Master Data Records"

    def __str__(self):
        return self.exchange_symbol

