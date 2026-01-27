"""
Trade model representing grouped trades and their individual legs.
"""

from django.db import models
from django.core.validators import MinLengthValidator
from decimal import Decimal


class Trade(models.Model):
    """
    Represents a single trade.    
    """
    
    trade_id = models.IntegerField(
        db_index=True,
        unique=True,
        help_text="Identifier to group legs of the same trade"
    )
    name = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(1)],
        help_text="Trade name or description"
    )
    description = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Free form description of the trade"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.trade_id} - {self.name}"


class TradeLeg(models.Model):
    """
    Represents a single leg of a trade.
    
    Multiple legs can share the same trade_id to form a complete trade.
    PnL is calculated as (exit_price - entry_price) * quantity for closed legs.
    """
    
    trade = models.ForeignKey(
        Trade,
        on_delete=models.CASCADE,
        to_field='trade_id',
        db_column='trade_id',
        related_name='legs',
        help_text="Foreign key to the parent trade"
    )
    ticker = models.CharField(
        max_length=100,
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
        max_digits=10,
        decimal_places=2,
        help_text="Price at which the position was entered"
    )
    exit_price = models.DecimalField(
        max_digits=10,
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
        ordering = ['trade', '-entry_date']
        verbose_name = 'Trade Leg'
        verbose_name_plural = 'Trade Legs'
        indexes = [
            models.Index(fields=['trade']),
            models.Index(fields=['entry_date']),
        ]

    def __str__(self):
        status = "Open" if self.is_open else "Closed"
        return f"{self.ticker} ({status})"

    @property
    def is_open(self) -> bool:
        """Check if this leg is still open."""
        return self.exit_price is None or self.exit_date is None

    @property
    def pnl(self) -> Decimal:
        """
        Calculate PnL for this leg.
        
        For closed positions: (exit_price - entry_price) * quantity
        For open positions: returns 0 (could be extended to use current market price)
        """
        if self.is_open:
            return Decimal('0.00')
        return (self.exit_price - self.entry_price) * self.quantity

    @property
    def is_profitable(self) -> bool:
        """Check if this leg is profitable."""
        return self.pnl > 0
