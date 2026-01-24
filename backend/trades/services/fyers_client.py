"""
Fyers API Client Service

Provides functionality to fetch live market prices from Fyers API.
Based on the FyersClient class from GoldMini Analysis notebook.

Usage:
    from trades.services.fyers_client import FyersClient
    
    client = FyersClient()
    quotes = client.get_quotes(["MCX:GOLDM26JANFUT", "NSE:RELIANCE-EQ"])
"""

import os
import logging
from typing import Dict, List, Optional, Any
from decimal import Decimal

logger = logging.getLogger(__name__)


class FyersClientError(Exception):
    """Custom exception for Fyers API errors."""
    pass


class FyersClient:
    """
    Client for interacting with Fyers API to fetch live market data.
    
    Requires the following environment variables:
        - FYERS_CLIENT_ID: Your Fyers API app ID (e.g., LLSNJOGT4J-100)
        - FYERS_ACCESS_TOKEN: Valid access token (expires daily)
    """
    
    def __init__(self):
        """Initialize the Fyers client with credentials from environment."""
        self.client_id = os.getenv('FYERS_CLIENT_ID')
        self.access_token = os.getenv('FYERS_ACCESS_TOKEN')
        self._fyers_model = None
        self._initialized = False
        
        if not self.client_id or not self.access_token:
            logger.warning(
                "Fyers credentials not configured. "
                "Set FYERS_CLIENT_ID and FYERS_ACCESS_TOKEN environment variables."
            )
        else:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Fyers API model."""
        try:
            from fyers_apiv3 import fyersModel
            
            self._fyers_model = fyersModel.FyersModel(
                client_id=self.client_id,
                token=self.access_token,
                log_path=""
            )
            self._initialized = True
            logger.info("Fyers client initialized successfully")
        except ImportError:
            logger.error("fyers_apiv3 package not installed. Run: pip install fyers-apiv3")
            raise FyersClientError("fyers_apiv3 package not installed")
        except Exception as e:
            logger.error(f"Failed to initialize Fyers client: {e}")
            raise FyersClientError(f"Failed to initialize Fyers client: {e}")
    
    @property
    def is_configured(self) -> bool:
        """Check if the client is properly configured."""
        return self._initialized and self._fyers_model is not None
    
    def get_quotes(self, symbols: List[str]) -> Dict[str, Any]:
        """
        Fetch live quotes for the given symbols.
        
        Args:
            symbols: List of Fyers symbols (e.g., ["MCX:GOLDM26JANFUT", "NSE:RELIANCE-EQ"])
        
        Returns:
            Dictionary with quote data for each symbol:
            {
                "MCX:GOLDM26JANFUT": {
                    "ltp": 132911.0,
                    "open": 131800.0,
                    "high": 133200.0,
                    "low": 131500.0,
                    "close": 131645.0,
                    "volume": 5815,
                    "change": 1266.0,
                    "change_percent": 0.96,
                    "bid": 132910.0,
                    "ask": 132915.0
                }
            }
        
        Raises:
            FyersClientError: If the API call fails or client is not configured
        """
        if not self.is_configured:
            raise FyersClientError("Fyers client not configured. Check credentials.")
        
        if not symbols:
            return {}
        
        try:
            data = {"symbols": ",".join(symbols)}
            response = self._fyers_model.quotes(data)
            
            if response.get('s') != 'ok':
                error_msg = response.get('message', 'Unknown error')
                logger.error(f"Fyers API error: {error_msg}")
                raise FyersClientError(f"Fyers API error: {error_msg}")
            
            # Parse response into a clean format
            quotes = {}
            for item in response.get('d', []):
                v = item.get('v', {})
                symbol = v.get('symbol', '')
                
                quotes[symbol] = {
                    'ltp': v.get('lp', 0),  # Last traded price
                    'open': v.get('open_price', 0),
                    'high': v.get('high_price', 0),
                    'low': v.get('low_price', 0),
                    'close': v.get('prev_close_price', 0),
                    'volume': v.get('volume', 0),
                    'change': v.get('ch', 0),  # Price change
                    'change_percent': v.get('chp', 0),  # Percentage change
                    'bid': v.get('bid', 0),
                    'ask': v.get('ask', 0),
                    'spread': v.get('spread', 0),
                }
            
            return quotes
            
        except FyersClientError:
            raise
        except Exception as e:
            logger.error(f"Error fetching quotes: {e}")
            raise FyersClientError(f"Error fetching quotes: {e}")
    
    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch live quote for a single symbol.
        
        Args:
            symbol: Fyers symbol (e.g., "MCX:GOLDM26JANFUT")
        
        Returns:
            Quote data dictionary or None if not found
        """
        quotes = self.get_quotes([symbol])
        return quotes.get(symbol)
    
    def get_ltp(self, symbol: str) -> Optional[float]:
        """
        Get just the last traded price for a symbol.
        
        Args:
            symbol: Fyers symbol
        
        Returns:
            Last traded price or None if not available
        """
        quote = self.get_quote(symbol)
        return quote.get('ltp') if quote else None


# Singleton instance for reuse
_fyers_client: Optional[FyersClient] = None


def get_fyers_client() -> FyersClient:
    """
    Get the singleton Fyers client instance.
    
    Returns:
        FyersClient instance
    """
    global _fyers_client
    if _fyers_client is None:
        _fyers_client = FyersClient()
    return _fyers_client
