import json
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

# Define the path to the cache file. It will be located in the common directory.
CACHE_FILE = Path(__file__).resolve().parent / "cache.json"

def _load_cache() -> dict:
    """Load the cache JSON file, returning an empty dict if the file does not exist or is invalid."""
    if not CACHE_FILE.exists():
        return {}
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to read cache file {CACHE_FILE}: {e}")
        return {}

def _write_cache(data: dict) -> None:
    """Write the provided dictionary to the cache file safely."""
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write cache file {CACHE_FILE}: {e}")

def set(key: str, value) -> None:
    """Set a value in the cache.

    Args:
        key: The cache key.
        value: Any JSON‑serialisable value to store.
    """
    cache = _load_cache()
    cache[key] = value
    _write_cache(cache)
    logger.debug(f"Cache updated – set {key}= {value}")

def get(key: str, default=None):
    """Retrieve a value from the cache.

    Args:
        key: The cache key.
        default: Value to return if the key is missing.
    """
    cache = _load_cache()
    return cache.get(key, default)
