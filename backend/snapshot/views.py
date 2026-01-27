"""
Views for Snapshot API endpoints.

Provides CRUD operations for Snapshots with live price fetching
to calculate movement since snapshot date.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Max
from decimal import Decimal
from datetime import date

from brokers.fyers.fyers_client import get_fyers_client
from .models import Snapshot, SnapshotLeg
from .serializers import SnapshotCreateSerializer, SnapshotUpdateSerializer
from brokers.fyers.fyers_master_client import get_fyers_master_client

class SnapshotViewSet(viewsets.ViewSet):
    """
    ViewSet for Snapshot CRUD operations.
    """
    DATE_FORMAT = "%Y-%m-%d"

    def _build_snapshot_response(self, snapshot):
        """
        Helper method to construct the snapshot response dictionary.
        """
        legs = SnapshotLeg.objects.filter(snapshot_id=snapshot.snapshot_id)
        
        # Build legs data
        legs_data = []
        for leg in legs:
            legs_data.append({
                'id': leg.id,
                'snapshot_id': leg.snapshot_id,
                'ticker': leg.ticker,
                'date': leg.date.strftime(self.DATE_FORMAT) if leg.date else None,
                'price': float(leg.price) if leg.price is not None else None,
                'quantity': leg.quantity,
                'current_price': None,
                'points_moved': None,
                'percentage_moved': None,
                'days_since_snapshot': None,
                'created_at': leg.created_at,
                'updated_at': leg.updated_at
            })

        leg_count = legs.count()
        tickers = list(legs.values_list('ticker', flat=True).distinct())

        return {
            'snapshot_id': snapshot.snapshot_id,
            'name': snapshot.name,
            'description': snapshot.description,
            'leg_count': leg_count,
            'tickers': tickers,
            'legs': legs_data,
            'created_at': snapshot.created_at,
            'updated_at': snapshot.updated_at
        }

    def list(self, request):
        """Get all snapshots (Structured for frontend pagination)."""
        queryset = Snapshot.objects.all().order_by('-snapshot_id')
        
        # Get pagination parameters from request
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
        except (TypeError, ValueError):
            page = 1
            page_size = 10
            
        start = (page - 1) * page_size
        end = start + page_size
        
        count = queryset.count()
        paged_queryset = queryset[start:end]
        
        results = [self._build_snapshot_response(snapshot) for snapshot in paged_queryset]

        return Response({
            'count': count,
            'results': results
        })

    def create(self, request):
        """Create a new snapshot."""
        tickers = self._find_all_tickers(request.data.get('snapshot_type'))
        data = request.data
        data['legs'] = self._generate_all_legs(tickers)
        serializer = SnapshotCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        snapshot = serializer.save()
        
        # Return the detailed snapshot view
        return Response(self._build_snapshot_response(snapshot), status=status.HTTP_201_CREATED)

    def getSnapshotBySnapshotId(self, request, snapshot_id=None):
        """Get a single snapshot with current prices and movement calculations."""
        try:
            snapshot = get_object_or_404(Snapshot, snapshot_id=snapshot_id)
            response = self._build_snapshot_response(snapshot)

            # Update with live prices and movement calculations
            self._update_live_prices(response)
            return Response(response)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, snapshot_id=None):
        """Update an existing snapshot."""
        snapshot = get_object_or_404(Snapshot, snapshot_id=snapshot_id)

        serializer = SnapshotUpdateSerializer(snapshot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_snapshot = serializer.save()
        
        return Response(self._build_snapshot_response(updated_snapshot))

    def partial_update(self, request, snapshot_id=None):
        """Partial update an existing snapshot."""
        return self.update(request, snapshot_id)

    def destroy(self, request, snapshot_id=None):
        """Delete a snapshot and its associated legs."""
        snapshot = get_object_or_404(Snapshot, snapshot_id=snapshot_id)
        # Delete associated legs first
        SnapshotLeg.objects.filter(snapshot_id=snapshot.snapshot_id).delete()
        snapshot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _update_live_prices(self, response):
        """
        Fetch current prices from Fyers API and calculate movement metrics.
        """
        tickers = list(set([leg['ticker'] for leg in response['legs'] if leg['ticker']]))
        
        if not tickers:
            return response

        try:
            # Fetch Fyers Live Quotes
            live_quotes = get_fyers_client().get_quotes(tickers)
        except Exception as e:
            # If Fyers API fails, just return without live prices
            print(f"Failed to fetch Fyers quotes: {e}")
            return response

        today = date.today()

        for leg in response['legs']:
            ticker = leg['ticker']
            
            # Update current price from Fyers
            if ticker in live_quotes:
                ltp = live_quotes[ticker].get('ltp')
                if ltp is not None:
                    leg['current_price'] = float(ltp)
                    
                    # Calculate movement
                    snapshot_price = leg['price']
                    if snapshot_price and snapshot_price > 0:
                        points_moved = float(ltp) - snapshot_price
                        percentage_moved = (points_moved / snapshot_price) * 100
                        
                        leg['points_moved'] = round(points_moved, 2)
                        leg['percentage_moved'] = round(percentage_moved, 2)

            # Calculate days since snapshot
            if leg['date']:
                try:
                    from datetime import datetime
                    snapshot_date = datetime.strptime(leg['date'], self.DATE_FORMAT).date()
                    leg['days_since_snapshot'] = (today - snapshot_date).days
                except Exception:
                    pass

        return response

    def _find_all_tickers(self, snapshot_type):
        tickers = []
        if str(snapshot_type).lower() == 'goldm':
            # Gold ETFs
            tickers = ['NSE:GOLDIETF-EQ', 'NSE:SETFGOLD-EQ', 'NSE:GROWWGOLD-EQ', 'NSE:GOLDBEES-EQ']
            all_mcx_symbols = get_fyers_master_client().get_symbol_master_details_by_underlying_symbol(str(snapshot_type).lower())

            # MCX Gold Futures
            futures = list(filter(lambda s: "FUT" in s and "MCX:GOLDM" in s, all_mcx_symbols))
            tickers.extend(futures)
        return tickers

    def _generate_all_legs(self, tickers):
        legs = []
        quotes = get_fyers_client().get_quotes(tickers)
        for ticker in tickers:
            if ticker in quotes:
                legs.append({
                    'ticker': ticker,
                    'date': date.today(),
                    'price': quotes[ticker].get('ltp'),
                    'quantity': 1,
                })
        return legs