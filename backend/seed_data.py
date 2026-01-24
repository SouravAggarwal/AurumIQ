import os
import django
import random
from datetime import date, timedelta
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aurumiq.settings')
django.setup()

from trade.models import Trade, TradeLeg

def clean_db():
    print("Cleaning database...")
    TradeLeg.objects.all().delete()
    Trade.objects.all().delete()
    print("Database cleaned.")

def seed_db():
    print("Seeding database...")
    
    # Trade 1: Closed Profitable Trade (AAPL)
    t1 = Trade.objects.create(
        trade_id=1,
        name="AAPL Swing Long",
        description="Caught the bounce off 150 moving average. Good risk/reward ratio."
    )
    
    TradeLeg.objects.create(
        trade=t1,
        ticker="AAPL",
        entry_date=date.today() - timedelta(days=10),
        entry_price=Decimal("150.00"),
        quantity=10,
        exit_date=date.today() - timedelta(days=2),
        exit_price=Decimal("165.00")
    )
    
    # Trade 2: Open Trade (TSLA)
    t2 = Trade.objects.create(
        trade_id=2,
        name="TSLA Breakout",
        description="Entering on consolidation breakout. Stop loss at 200."
    )
    
    TradeLeg.objects.create(
        trade=t2,
        ticker="TSLA",
        entry_date=date.today() - timedelta(days=1),
        entry_price=Decimal("210.50"),
        quantity=5
    )
    
    # Trade 3: Multi-leg Trade (SPY Iron Condor - Dummy representation as individual legs)
    t3 = Trade.objects.create(
        trade_id=3,
        name="SPY Iron Condor",
        description="Neutral strategy for low volatility week."
    )
    
    TradeLeg.objects.create(
        trade=t3,
        ticker="SPY",
        entry_date=date.today() - timedelta(days=5),
        entry_price=Decimal("5.00"),
        quantity=-1, # Short Call
        exit_date=date.today() - timedelta(days=1),
        exit_price=Decimal("0.50")
    )
    
    TradeLeg.objects.create(
        trade=t3,
        ticker="SPY",
        entry_date=date.today() - timedelta(days=5),
        entry_price=Decimal("4.50"),
        quantity=1, # Long Call
        exit_date=date.today() - timedelta(days=1),
        exit_price=Decimal("0.10")
    )

    print("Database seeded successfully!")
    print(f"Created {Trade.objects.count()} trades and {TradeLeg.objects.count()} legs.")

if __name__ == "__main__":
    clean_db()
    seed_db()
