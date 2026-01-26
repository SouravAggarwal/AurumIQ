import os
import pandas as pd
from typing import List, Dict, Optional


class FyersMasterClient:
    """
    Manages Fyers MCX contract master using
    a local Excel cache as the source of truth.
    """

    MCX_CONTRACT_MASTER_URL = "https://public.fyers.in/sym_details/MCX_COM.csv"
    MCX_CONTRACT_MASTER_FILE = "mcx_fyers_master.xlsx"
    
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

    def __init__(self):
        self._cache_file = self.MCX_CONTRACT_MASTER_FILE

    # ==================================================
    # Public APIs
    # ==================================================

    def update_fyers_master_cache_file(self) -> None:
        """
        Refreshes the entire master file:
        """
        if os.path.exists(self._cache_file):
            os.remove(self._cache_file)

        df = pd.read_csv(
            self.MCX_CONTRACT_MASTER_URL,
            header=None,
            names=self.COLUMNS,
            dtype=str,
        )

        filtered_df = df[
            (df["underlying_symbol"].str.lower().isin(['silverm', 'goldm'])) &
            (df["symbol_details"].str.contains("fut", case=False, na=False))
        ]
        filtered_df.to_excel(self._cache_file, index=False)

    def get_symbol_master_details(self, symbols: List[str]) -> Dict[str, dict]:
        """
        Exact match on exchange_symbol.
        Reads only from cache.
        """
        df = self._load_cache()
        result: Dict[str, dict] = {}

        for symbol in symbols:
            symbol_df = df[
                (df["exchange_symbol"].str.lower() == symbol.lower())
            ]

            if not symbol_df.empty:
                result[symbol] = self._select_active_future(symbol_df) 
            else:
                result[symbol] = {}

        return result

    def get_symbol_master_details_by_underlying_symbol(
        self, underlying_symbol: str
    ) -> dict:
        """
        Exact match on underlying_symbol.
        Only FUT contracts.
        Reads only from cache.
        """
        df = self._load_cache()

        filtered_df = df[
            (df["underlying_symbol"].str.lower() == underlying_symbol.lower()) &
            (df["symbol_details"].str.contains("fut", case=False, na=False))
        ]

        return self._select_active_future(filtered_df)

    # ==================================================
    # Internal Helpers
    # ==================================================

    def _load_cache(self) -> pd.DataFrame:
        if not os.path.exists(self._cache_file):
            raise FileNotFoundError(
                "Fyers master cache file not found. "
                "Call update_fyers_master_cache_file() first."
            )

        return pd.read_excel(self._cache_file, dtype=str)

    def _select_active_future(self, df: pd.DataFrame) -> dict:
        """
        Selects nearest expiry contract.
        """
        if df.empty:
            return {}

        df = df.copy()
        df["expiry_epoch"] = pd.to_numeric(df["expiry_epoch"], errors="coerce")

        active_row = df.sort_values("expiry_epoch").iloc[0]
        return active_row.to_dict()

# Singleton instance
_fyers_master_client: Optional[FyersMasterClient] = None

def get_fyers_master_client() -> FyersMasterClient:
    global _fyers_master_client
    if _fyers_master_client is None:
        _fyers_master_client = FyersMasterClient()
    return _fyers_master_client
