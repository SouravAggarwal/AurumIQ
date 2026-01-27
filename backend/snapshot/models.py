"""
Snapshot models representing ticker price snapshots at specific points in time.
"""

from django.db import models
from django.core.validators import MinLengthValidator


class Snapshot(models.Model):
    """
    Represents a snapshot to group multiple ticker observations at a point in time.
    """
    
    snapshot_id = models.IntegerField(
        db_index=True,
        unique=True,
        help_text="Identifier to group legs of the same snapshot"
    )
    name = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(1)],
        help_text="Snapshot name or description"
    )
    description = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Free form description of the snapshot"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.snapshot_id} - {self.name}"


class SnapshotLeg(models.Model):
    """
    Represents a single ticker observation within a snapshot.
    
    Stores the ticker, date, price, and quantity at the time of snapshot.
    Current price and movement calculations are done dynamically in views.
    """
    
    snapshot = models.ForeignKey(
        Snapshot,
        on_delete=models.CASCADE,
        to_field='snapshot_id',
        db_column='snapshot_id',
        related_name='legs',
        help_text="Foreign key to the parent snapshot"
    )
    ticker = models.CharField(
        max_length=100,
        help_text="Stock or instrument ticker symbol"
    )
    date = models.DateField(
        help_text="Date when the snapshot was taken"
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price at which the snapshot was entered"
    )
    quantity = models.IntegerField(
        help_text="Number of shares/contracts (negative for short positions)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['snapshot', '-date']
        verbose_name = 'Snapshot Leg'
        verbose_name_plural = 'Snapshot Legs'
        indexes = [
            models.Index(fields=['snapshot']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.ticker} @ {self.date}"
