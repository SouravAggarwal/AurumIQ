"""
Management command to seed the database with sample trade data.

Usage: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from trades.models import TradeLeg


class Command(BaseCommand):
    help = 'Seeds the database with sample trade data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing trade data...')
            TradeLeg.objects.all().delete()
        
        self.stdout.write('Seeding trade data...')
        
        # Sample tickers
        tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']
        
        # Create sample trades
        trades_data = [
            # Trade 1: Simple closed long trade (AAPL)
            {
                'trade_id': 1,
                'name': 'Apple Long Position',
                'legs': [
                    {
                        'ticker': 'AAPL',
                        'is_open': False,
                        'entry_date': date(2025, 1, 5),
                        'exit_date': date(2025, 1, 20),
                        'entry_price': Decimal('185.50'),
                        'exit_price': Decimal('195.75'),
                        'quantity': 100,
                    }
                ]
            },
            # Trade 2: Multi-leg spread (closed)
            {
                'trade_id': 2,
                'name': 'Google Bull Spread',
                'legs': [
                    {
                        'ticker': 'GOOGL',
                        'is_open': False,
                        'entry_date': date(2025, 1, 10),
                        'exit_date': date(2025, 2, 5),
                        'entry_price': Decimal('142.00'),
                        'exit_price': Decimal('155.50'),
                        'quantity': 50,
                    },
                    {
                        'ticker': 'GOOGL',
                        'is_open': False,
                        'entry_date': date(2025, 1, 10),
                        'exit_date': date(2025, 2, 5),
                        'entry_price': Decimal('160.00'),
                        'exit_price': Decimal('155.50'),
                        'quantity': -50,  # Short leg
                    }
                ]
            },
            # Trade 3: Open position (MSFT)
            {
                'trade_id': 3,
                'name': 'Microsoft Swing Trade',
                'legs': [
                    {
                        'ticker': 'MSFT',
                        'is_open': True,
                        'entry_date': date(2025, 2, 1),
                        'exit_date': None,
                        'entry_price': Decimal('405.00'),
                        'exit_price': None,
                        'quantity': 75,
                    }
                ]
            },
            # Trade 4: Closed short trade (TSLA)
            {
                'trade_id': 4,
                'name': 'Tesla Short',
                'legs': [
                    {
                        'ticker': 'TSLA',
                        'is_open': False,
                        'entry_date': date(2025, 1, 15),
                        'exit_date': date(2025, 1, 25),
                        'entry_price': Decimal('250.00'),
                        'exit_price': Decimal('235.00'),
                        'quantity': -40,  # Short position
                    }
                ]
            },
            # Trade 5: Multi-leg open trade (NVDA)
            {
                'trade_id': 5,
                'name': 'NVIDIA Calendar Spread',
                'legs': [
                    {
                        'ticker': 'NVDA',
                        'is_open': True,
                        'entry_date': date(2025, 2, 10),
                        'exit_date': None,
                        'entry_price': Decimal('720.00'),
                        'exit_price': None,
                        'quantity': 30,
                    },
                    {
                        'ticker': 'NVDA',
                        'is_open': False,
                        'entry_date': date(2025, 2, 10),
                        'exit_date': date(2025, 2, 15),
                        'entry_price': Decimal('750.00'),
                        'exit_price': Decimal('735.00'),
                        'quantity': -30,
                    }
                ]
            },
            # Trade 6: Amazon swing (closed profitable)
            {
                'trade_id': 6,
                'name': 'Amazon Earnings Play',
                'legs': [
                    {
                        'ticker': 'AMZN',
                        'is_open': False,
                        'entry_date': date(2024, 12, 1),
                        'exit_date': date(2024, 12, 20),
                        'entry_price': Decimal('188.00'),
                        'exit_price': Decimal('210.50'),
                        'quantity': 60,
                    }
                ]
            },
            # Trade 7: Meta position (closed loss)
            {
                'trade_id': 7,
                'name': 'Meta Momentum Trade',
                'legs': [
                    {
                        'ticker': 'META',
                        'is_open': False,
                        'entry_date': date(2024, 11, 15),
                        'exit_date': date(2024, 12, 1),
                        'entry_price': Decimal('565.00'),
                        'exit_price': Decimal('545.25'),
                        'quantity': 25,
                    }
                ]
            },
            # Trade 8: Netflix open position
            {
                'trade_id': 8,
                'name': 'Netflix Growth Bet',
                'legs': [
                    {
                        'ticker': 'NFLX',
                        'is_open': True,
                        'entry_date': date(2025, 1, 28),
                        'exit_date': None,
                        'entry_price': Decimal('890.00'),
                        'exit_price': None,
                        'quantity': 15,
                    }
                ]
            },
            # Trade 9: Diversified closed trade
            {
                'trade_id': 9,
                'name': 'Tech Sector Rotation',
                'legs': [
                    {
                        'ticker': 'AAPL',
                        'is_open': False,
                        'entry_date': date(2024, 10, 5),
                        'exit_date': date(2024, 11, 10),
                        'entry_price': Decimal('175.00'),
                        'exit_price': Decimal('182.50'),
                        'quantity': 80,
                    },
                    {
                        'ticker': 'MSFT',
                        'is_open': False,
                        'entry_date': date(2024, 10, 5),
                        'exit_date': date(2024, 11, 10),
                        'entry_price': Decimal('385.00'),
                        'exit_price': Decimal('410.00'),
                        'quantity': 40,
                    }
                ]
            },
            # Trade 10: Complex multi-leg (partially closed)
            {
                'trade_id': 10,
                'name': 'Iron Condor GOOGL',
                'legs': [
                    {
                        'ticker': 'GOOGL',
                        'is_open': True,
                        'entry_date': date(2025, 2, 5),
                        'exit_date': None,
                        'entry_price': Decimal('150.00'),
                        'exit_price': None,
                        'quantity': 100,
                    },
                    {
                        'ticker': 'GOOGL',
                        'is_open': False,
                        'entry_date': date(2025, 2, 5),
                        'exit_date': date(2025, 2, 12),
                        'entry_price': Decimal('145.00'),
                        'exit_price': Decimal('148.00'),
                        'quantity': -100,
                    }
                ]
            },
            # Trade 11: TSLA reversal trade
            {
                'trade_id': 11,
                'name': 'Tesla Reversal',
                'legs': [
                    {
                        'ticker': 'TSLA',
                        'is_open': False,
                        'entry_date': date(2024, 9, 10),
                        'exit_date': date(2024, 10, 15),
                        'entry_price': Decimal('220.00'),
                        'exit_price': Decimal('265.00'),
                        'quantity': 50,
                    }
                ]
            },
            # Trade 12: NVDA momentum
            {
                'trade_id': 12,
                'name': 'NVIDIA AI Momentum',
                'legs': [
                    {
                        'ticker': 'NVDA',
                        'is_open': False,
                        'entry_date': date(2024, 8, 1),
                        'exit_date': date(2024, 9, 5),
                        'entry_price': Decimal('580.00'),
                        'exit_price': Decimal('650.00'),
                        'quantity': 45,
                    }
                ]
            },
        ]
        
        # Create the trades
        created_count = 0
        for trade in trades_data:
            for leg_data in trade['legs']:
                TradeLeg.objects.create(
                    trade_id=trade['trade_id'],
                    name=trade['name'],
                    **leg_data
                )
                created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(trades_data)} trades with {created_count} legs'
            )
        )
        
        # Print summary
        total_trades = TradeLeg.objects.values('trade_id').distinct().count()
        open_trades = TradeLeg.objects.filter(is_open=True).values('trade_id').distinct().count()
        total_legs = TradeLeg.objects.count()
        
        self.stdout.write(f'\nDatabase Summary:')
        self.stdout.write(f'  Total Trades: {total_trades}')
        self.stdout.write(f'  Open Trades: {open_trades}')
        self.stdout.write(f'  Total Legs: {total_legs}')
