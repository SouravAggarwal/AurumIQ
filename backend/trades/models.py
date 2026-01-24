"""
Trade model representing individual legs of a trade.

Each trade can have multiple legs (e.g., multi-leg options strategies).
Legs are grouped by trade_id for aggregation and display.
"""

from django.db import models
from django.core.validators import MinLengthValidator
from decimal import Decimal


class TradeLeg(models.Model):
    """
    Represents a single leg of a trade.
    
    Multiple legs can share the same trade_id to form a complete trade.
    PnL is calculated as (exit_price - entry_price) * quantity for closed legs.
    """
    
    trade_id = models.IntegerField(
        db_index=True,
        help_text="Identifier to group legs of the same trade"
    )
    name = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(1)],
        help_text="Trade name or description"
    )
    is_open = models.BooleanField(
        default=True,
        help_text="Whether this leg is still open"
    )
    ticker = models.CharField(
        max_length=20,
        help_text="Stock or instrument ticker symbol"
    )
    entry_date = models.DateField(
        help_text="Date when the position was entered"
    )
    exit_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when the position was exited (null if still open)"
    )
    entry_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Price at which the position was entered"
    )
    exit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price at which the position was exited (null if still open)"
    )
    quantity = models.IntegerField(
        help_text="Number of shares/contracts (negative for short positions)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['trade_id', '-entry_date']
        verbose_name = 'Trade Leg'
        verbose_name_plural = 'Trade Legs'
        indexes = [
            models.Index(fields=['trade_id', 'is_open']),
            models.Index(fields=['entry_date']),
        ]

    def __str__(self):
        status = "Open" if self.is_open else "Closed"
        return f"{self.name} - {self.ticker} ({status})"

    @property
    def pnl(self) -> Decimal:
        """
        Calculate PnL for this leg.
        
        For closed positions: (exit_price - entry_price) * quantity
        For open positions: returns 0 (could be extended to use current market price)
        """
        if self.is_open or self.exit_price is None:
            return Decimal('0.00')
        return (self.exit_price - self.entry_price) * self.quantity

    @property
    def is_profitable(self) -> bool:
        """Check if this leg is profitable."""
        return self.pnl > 0
