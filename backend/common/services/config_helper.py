import logging
from typing import Optional

logger = logging.getLogger(__name__)

class ConfigurationHelper:
    """
    Utility class to manage configuration key-value pairs in the database.
    """
    
    @staticmethod
    def get(key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Fetch a configuration value by key.
        """
        from common.models import Configuration
        try:
            config = Configuration.objects.filter(key=key).first()
            return config.value if config else default
        except Exception as e:
            logger.error(f"Error fetching configuration key '{key}': {e}")
            return default

    @staticmethod
    def set(key: str, value: str) -> None:
       """
       Save or update a configuration value for a given key.
       """
       from common.models import Configuration
       try:
           Configuration.objects.update_or_create(
               key=key,
               defaults={'value': str(value)}
           )
       except Exception as e:
           logger.error(f"Error setting configuration key '{key}': {e}")
