from django.core.management.base import BaseCommand
from trade.models import Trade, TradeLeg
from decimal import Decimal
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Populates the database with dummy trade data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting existing data...')
        TradeLeg.objects.all().delete()
        Trade.objects.all().delete()

        self.stdout.write('Creating dummy trades...')
        
        # Trade 1: AAPL Long (Open)
        t1 = Trade.objects.create(
            trade_id=101,
            name="AAPL Long Strategy",
            description="Long position in AAPL expecting growth"
        )
        TradeLeg.objects.create(
            trade=t1,
            ticker="AAPL",
            entry_date=date.today() - timedelta(days=10),
            entry_price=Decimal("175.50"),
            quantity=100
        )
        
        # Trade 2: SPY Iron Condor (Closed, Profitable)
        t2 = Trade.objects.create(
            trade_id=102,
            name="SPY Iron Condor",
            description="Neutral strategy on SPY weekly"
        )
        # Leg 1: Long Put 400
        TradeLeg.objects.create(
            trade=t2,
            ticker="SPY",
            entry_date=date.today() - timedelta(days=20),
            exit_date=date.today() - timedelta(days=5),
            entry_price=Decimal("2.50"),
            exit_price=Decimal("0.10"),
            quantity=1
        )
        # Leg 2: Short Put 410
        TradeLeg.objects.create(
            trade=t2,
            ticker="SPY",
            entry_date=date.today() - timedelta(days=20),
            exit_date=date.today() - timedelta(days=5),
            entry_price=Decimal("5.00"),
            exit_price=Decimal("0.05"),
            quantity=-1
        )
        # Leg 3: Short Call 430
        TradeLeg.objects.create(
            trade=t2,
            ticker="SPY",
            entry_date=date.today() - timedelta(days=20),
            exit_date=date.today() - timedelta(days=5),
            entry_price=Decimal("4.00"),
            exit_price=Decimal("0.05"),
            quantity=-1
        )
        # Leg 4: Long Call 440
        TradeLeg.objects.create(
            trade=t2,
            ticker="SPY",
            entry_date=date.today() - timedelta(days=20),
            exit_date=date.today() - timedelta(days=5),
            entry_price=Decimal("1.50"),
            exit_price=Decimal("0.01"),
            quantity=1
        )
        
        # Trade 3: TSLA Swing (Mixed)
        t3 = Trade.objects.create(
            trade_id=103,
            name="TSLA Swing Trade",
            description="Swing trading TSLA volatility"
        )
        TradeLeg.objects.create(
            trade=t3,
            ticker="TSLA",
            entry_date=date.today() - timedelta(days=5),
            entry_price=Decimal("200.00"),
            quantity=50
        )
        # Partial exit or hedged leg
        TradeLeg.objects.create(
            trade=t3,
            ticker="TSLA",
            entry_date=date.today() - timedelta(days=2),
            exit_date=date.today(),
            entry_price=Decimal("210.00"),
            exit_price=Decimal("205.00"), # Loss on this hedge
            quantity=-10
        )

        # Trade 4: NVDA Breakout (Open)
        t4 = Trade.objects.create(
            trade_id=104,
            name="NVDA AI Boom",
            description="Riding the AI wave"
        )
        TradeLeg.objects.create(
            trade=t4,
            ticker="NVDA",
            entry_date=date.today() - timedelta(days=2),
            entry_price=Decimal("450.00"),
            quantity=20
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created {Trade.objects.count()} trades and {TradeLeg.objects.count()} legs.'))
