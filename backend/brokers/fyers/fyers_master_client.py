import os
import pandas as pd
from typing import List, Dict, Optional
from django.db import transaction


class FyersMasterClient:
    """
    Manages Fyers MCX contract master using
    the database as the source of truth.
    """

    MCX_CONTRACT_MASTER_URL = "https://public.fyers.in/sym_details/MCX_COM.csv"
    
    COLUMNS = [
        "fytoken",
        "symbol_details",
        "exchange_instrument_type",
        "min_lot_size",
        "tick_size",
        "isin",
        "trading_session",
        "last_update_date",
        "expiry_epoch",
        "exchange_symbol",
        "exchange",
        "segment",
        "scrip_code",
        "underlying_symbol",
        "underlying_scrip_code",
        "strike_price",
        "option_type",
        "underlying_fytoken",
        "expiry_epoch_dup",
        "reserved_1",
        "reserved_2",
    ]

    # ==================================================
    # Public APIs
    # ==================================================

    def update_fyers_master_cache_file(self) -> None:
        """
        Refreshes the entire master data in the database.
        """
        from brokers.models import FyersMasterData

        # Fetch CSV
        df = pd.read_csv(
            self.MCX_CONTRACT_MASTER_URL,
            header=None,
            names=self.COLUMNS,
            dtype=str,
        )

        # Filter for relevant MCX instruments
        filtered_df = df[
            (df["underlying_symbol"].str.lower().isin(['silverm', 'goldm']))
        ]

        # Use a transaction for atomic update
        with transaction.atomic():
            # Clear existing data
            FyersMasterData.objects.all().delete()
            
            # Prepare records for bulk create
            records = []
            for _, row in filtered_df.iterrows():
                # Convert row to dict for raw_data storage and clean NaNs for JSON compatibility
                row_dict = {k: (None if pd.isna(v) else v) for k, v in row.items()}
                
                # Parse numeric fields safely
                try:
                    expiry_epoch = int(row.get('expiry_epoch', 0))
                except (ValueError, TypeError):
                    expiry_epoch = 0

                records.append(FyersMasterData(
                    exchange_symbol=row.get('exchange_symbol'),
                    underlying_symbol=row.get('underlying_symbol'),
                    expiry_epoch=expiry_epoch,
                    expiry_epoch_dup=row.get('expiry_epoch_dup'),
                    symbol_details=row.get('symbol_details'),
                    raw_data=row_dict
                ))

            
            # Bulk create records
            FyersMasterData.objects.bulk_create(records)

    def get_symbol_master_details(self, symbols: List[str]) -> Dict[str, dict]:
        """
        Exact match on exchange_symbol.
        Reads only from database.
        """
        from brokers.models import FyersMasterData
        result: Dict[str, dict] = {}

        for symbol in symbols:
            # Case insensitive match
            active_record = FyersMasterData.objects.filter(
                exchange_symbol__iexact=symbol
            ).first()

            if active_record:
                result[symbol] = active_record.raw_data
            else:
                result[symbol] = {}

        return result

    def get_symbol_master_details_by_underlying_symbol(
        self, underlying_symbol: str
    ) -> dict:
        """
        Exact match on underlying_symbol.
        Only FUT contracts (already filtered during update).
        Reads only from database.
        """
        from brokers.models import FyersMasterData

        queryset = FyersMasterData.objects.filter(
            underlying_symbol__iexact=underlying_symbol
        ).order_by('expiry_epoch')

        response = []
        for instrument in queryset:
            response.append(instrument.exchange_symbol)

        return set(response)

    # ==================================================
    # Internal Helpers (Maintained for logic, but modified to use DB)
    # ==================================================

    def _load_cache(self) -> pd.DataFrame:
        """
        Maintained for backward compatibility, but now loads from DB.
        Prefer direct DB queries via public APIs.
        """
        from brokers.models import FyersMasterData
        records = FyersMasterData.objects.all()
        if not records.exists():
            raise FileNotFoundError(
                "Fyers master data not found in database. "
                "Call update_fyers_master_cache_file() first."
            )
        
        # Build DataFrame from raw_data JSON
        data_list = [r.raw_data for r in records]
        return pd.DataFrame(data_list)

# Singleton instance
_fyers_master_client: Optional[FyersMasterClient] = None

def get_fyers_master_client() -> FyersMasterClient:
    global _fyers_master_client
    if _fyers_master_client is None:
        _fyers_master_client = FyersMasterClient()
    return _fyers_master_client

