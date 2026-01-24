"""
Fyers API Client Service

Provides functionality to fetch live market prices from Fyers API.
Handles OAuth2 authentication flow and token management using a local cache file.

Usage:
    from brokers.services.fyers_client import FyersClient
    
    client = FyersClient()
    # Check if connected
    if client.is_authenticated:
        quotes = client.get_quotes(["MCX:GOLDM26JANFUT"])
    else:
        url = client.generate_auth_url()
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urlparse, parse_qs
from django.conf import settings
from pathlib import Path
from fyers_apiv3 import fyersModel
from common import cache_helper

logger = logging.getLogger(__name__)


class FyersClientError(Exception):
    """Custom exception for Fyers API errors."""
    pass


class FyersClient:
    """
    Client for interacting with Fyers API to fetch live market data.
    
    Requires the following environment variables:
        - FYERS_CLIENT_ID: Your Fyers API app ID
        - FYERS_SECRET_KEY: Your Fyers App Secret
        - FYERS_REDIRECT_URI: Redirect URI configured in Fyers App
    """
    
    CACHE_KEY_ACCESS_TOKEN = 'fyers_access_token'
    
    def __init__(self):
        """Initialize the Fyers client with credentials."""
        self.client_id = os.getenv('FYERS_CLIENT_ID')
        self.secret_key = os.getenv('FYERS_SECRET_KEY')
        self.redirect_uri = os.getenv('FYERS_REDIRECT_URI', 'https://kite.zerodha.com/markets')
        self.grant_type = "authorization_code"
        self.response_type = "code"
        self.state = "sample"
        self._fyers_model = None
        
        if not self.client_id or not self.secret_key:
            logger.warning(
                "Fyers credentials not configured. "
                "Set FYERS_CLIENT_ID and FYERS_SECRET_KEY environment variables."
            )
    
    @property
    def is_authenticated(self) -> bool:
        """Check if we have a valid access token."""
        return bool(self._get_access_token())

    @property
    def is_configured(self) -> bool:
        """Check if Fyers credentials are configured."""
        return bool(self.client_id and self.secret_key)
        
    def generate_auth_url(self) -> str:
        """Step 1: Generate the Fyers OAuth2 login URL."""
        if not self.client_id or not self.secret_key:
            raise FyersClientError("Missing Fyers credentials")
            
        try:
            session = fyersModel.SessionModel(
                client_id=self.client_id,
                secret_key=self.secret_key,
                redirect_uri=self.redirect_uri,
                response_type=self.response_type,
                grant_type=self.grant_type,
                state=self.state
            )
            
            return session.generate_authcode()
            
        except ImportError:
            raise FyersClientError("fyers_apiv3 package not installed")
        except Exception as e:
            logger.error(f"Error generating auth URL: {e}")
            raise FyersClientError(f"Error generating auth URL: {e}")

    def generate_token(self, auth_code_or_url: str) -> str:
        """
        Step 2: Exchange auth code (or full redirect URL) for access token.
        
        Args:
            auth_code_or_url: The auth code string OR the full redirect URL containing auth_code.
            
        Returns:
            The access token.
        """
        auth_code = auth_code_or_url.strip()
        
        # If full URL is provided, extract the auth_code
        if 'auth_code=' in auth_code:
            try:
                parsed = urlparse(auth_code)
                params = parse_qs(parsed.query)
                auth_code = params.get('auth_code', [None])[0]
                if not auth_code:
                    raise ValueError("auth_code not found in URL")
            except Exception as e:
                raise FyersClientError(f"Invalid auth URL: {e}")

        try:
            session = fyersModel.SessionModel(
                client_id=self.client_id,
                secret_key=self.secret_key,
                redirect_uri=self.redirect_uri,
                response_type=self.response_type,
                grant_type=self.grant_type,
                state=self.state
            )
            
            session.set_token(auth_code)
            response = session.generate_token()
            
            access_token = response.get("access_token")
            if not access_token:
                logger.error(f"Failed to generate token. Response: {response}")
                raise FyersClientError(f"Failed to generate token: {response}")
                
            self._save_access_token(access_token)
            logger.info("Fyers access token generated and cached successfully")
            return access_token
            
        except ImportError:
            raise FyersClientError("fyers_apiv3 package not installed")
        except Exception as e:
            logger.error(f"Error generating token: {e}")
            raise FyersClientError(f"Error generating token: {e}")

    def get_profile(self) -> Dict[str, Any]:
        """
        Step 3: Fetch the authenticated user's profile information from Fyers.
        
        Returns:
            Dict containing user profile data including name, email, pan, etc.
        """
        try:
            fyers = self._get_model()
            response = fyers.get_profile()
            
            if response.get('s') != 'ok':
                error_msg = response.get('message', 'Unknown error')
                logger.error(f"Fyers profile API error: {error_msg}")
                raise FyersClientError(f"Failed to fetch profile: {error_msg}")
            
            return response.get('data', {})
            
        except FyersClientError:
            raise
        except Exception as e:
            logger.error(f"Error fetching profile: {e}")
            raise FyersClientError(f"Error fetching profile: {e}")

    def get_quotes(self, symbols: List[str]) -> Dict[str, Any]:
        """
        Fetch live quotes for the given symbols.
        """
        if not symbols:
            return {}
            
        try:
            fyers = self._get_model()
            data = {"symbols": ",".join(symbols)}
            response = fyers.quotes(data)
            
            if response.get('s') != 'ok':
                # If invalid token, might need to re-auth
                msg = response.get('message', '')
                if 'token' in msg.lower() or 'expired' in msg.lower():
                    # Could inadvertently happen if cache persists but token blocked
                    # Try to delete token from file
                    self._save_access_token("") # Or implement explicit delete
                    raise FyersClientError("Token expired or invalid. Please re-authenticate.")
                    
                error_msg = response.get('message', 'Unknown error')
                logger.error(f"Fyers API error: {error_msg}")
                raise FyersClientError(f"Fyers API error: {error_msg}")
            
            # Parse response
            quotes = {}
            for item in response.get('d', []):
                v = item.get('v', {})
                symbol = v.get('symbol', '')
                
                quotes[symbol] = {
                    'ltp': v.get('lp', 0),
                    'open': v.get('open_price', 0),
                    'high': v.get('high_price', 0),
                    'low': v.get('low_price', 0),
                    'close': v.get('prev_close_price', 0),
                    'volume': v.get('volume', 0),
                    'change': v.get('ch', 0),
                    'change_percent': v.get('chp', 0),
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
        """Fetch live quote for a single symbol."""
        quotes = self.get_quotes([symbol])
        return quotes.get(symbol)
    
    def get_ltp(self, symbol: str) -> Optional[float]:
        """Get just the last traded price for a symbol."""
        quote = self.get_quote(symbol)
        return quote.get('ltp') if quote else None

    def _get_model(self):
        """Get or initialize the FyersModel instance."""
        token = self._get_access_token()
        if not token:
            raise FyersClientError("No access token found. Please authenticate first.")
            
        if self._fyers_model is None:
            try:
                self._fyers_model = fyersModel.FyersModel(
                    client_id=self.client_id,
                    token=token,
                    log_path=""
                )
            except Exception as e:
                raise FyersClientError(f"Error initializing FyersModel: {e}")
                
        return self._fyers_model

    def _get_access_token(self) -> Optional[str]:
        """Retrieve access token using cache_helper."""
        try:
            return cache_helper.get(self.CACHE_KEY_ACCESS_TOKEN)
        except Exception as e:
            logger.error(f"Error reading token from cache: {e}")
        return None
    
    def _save_access_token(self, token: str):
        """Save access token using cache_helper."""
        try:
            cache_helper.set(self.CACHE_KEY_ACCESS_TOKEN, token)
        except Exception as e:
            logger.error(f"Error saving token to cache: {e}")
        

# Singleton instance
_fyers_client: Optional[FyersClient] = None

def get_fyers_client() -> FyersClient:
    global _fyers_client
    if _fyers_client is None:
        _fyers_client = FyersClient()
    return _fyers_client
