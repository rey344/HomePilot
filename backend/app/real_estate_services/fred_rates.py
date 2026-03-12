"""FRED API integration for real-time mortgage rate data.

Federal Reserve Economic Data (FRED) provides official mortgage rate data
from the Federal Reserve Bank of St. Louis.

API Docs: https://fred.stlouisfed.org/docs/api/fred/
"""
import os
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Cache for mortgage rate (updated once per day)
_rate_cache: Optional[dict] = None


class FredRatesService:
    """Service for fetching mortgage rates from FRED API."""
    
    BASE_URL = "https://api.stlouisfed.org/fred"
    MORTGAGE_30_SERIES = "MORTGAGE30US"  # 30-Year Fixed Rate Mortgage Average
    DEFAULT_RATE = Decimal("6.5")  # Fallback if API unavailable
    
    def __init__(self, api_key: str = ""):
        """Initialize FRED service.
        
        Args:
            api_key: FRED API key (get free key at fred.stlouisfed.org)
        """
        self.api_key = api_key or settings.fred_api_key
        self.client = httpx.AsyncClient(timeout=10.0)
    
    async def get_current_mortgage_rate(self) -> Decimal:
        """Fetch current 30-year fixed mortgage rate.
        
        Returns:
            Current mortgage rate as Decimal (e.g., Decimal("7.12") for 7.12%)
            Falls back to DEFAULT_RATE if API key not set or request fails
        """
        global _rate_cache
        
        # Use cached rate if fresh (< 24 hours old)
        if _rate_cache and self._is_cache_fresh():
            logger.info(f"Using cached mortgage rate: {_rate_cache['rate']}%")
            return _rate_cache['rate']
        
        # If no API key, use default
        if not self.api_key:
            logger.warning(
                f"FRED_API_KEY not set, using default rate {self.DEFAULT_RATE}%. "
                "Get free key at https://fred.stlouisfed.org/docs/api/api_key.html"
            )
            return self.DEFAULT_RATE
        
        try:
            # Fetch latest observation from FRED
            response = await self.client.get(
                f"{self.BASE_URL}/series/observations",
                params={
                    "series_id": self.MORTGAGE_30_SERIES,
                    "api_key": self.api_key,
                    "file_type": "json",
                    "sort_order": "desc",  # Most recent first
                    "limit": 1  # Only get latest value
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if "observations" not in data or not data["observations"]:
                logger.error("FRED API returned no observations")
                return self.DEFAULT_RATE
            
            # Extract rate from response
            observation = data["observations"][0]
            rate_str = observation.get("value", ".")
            
            # Handle missing data (FRED returns "." for missing values)
            if rate_str == ".":
                logger.warning("FRED returned missing data, using default rate")
                return self.DEFAULT_RATE
            
            rate = Decimal(rate_str)
            observation_date = observation.get("date", "unknown")
            
            # Cache the result
            _rate_cache = {
                "rate": rate,
                "date": observation_date,
                "fetched_at": datetime.now()
            }
            
            logger.info(f"Fetched mortgage rate from FRED: {rate}% (as of {observation_date})")
            return rate
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching FRED data: {e}")
            return self.DEFAULT_RATE
        except (KeyError, ValueError, Exception) as e:
            logger.error(f"Error parsing FRED response: {e}")
            return self.DEFAULT_RATE
    
    def _is_cache_fresh(self) -> bool:
        """Check if cached rate is less than 24 hours old."""
        if not _rate_cache or "fetched_at" not in _rate_cache:
            return False
        
        age = datetime.now() - _rate_cache["fetched_at"]
        return age < timedelta(hours=24)
    
    async def get_rate_metadata(self) -> dict:
        """Get metadata about the cached rate (for debugging/display).
        
        Returns:
            Dict with rate, date, and source information
        """
        rate = await self.get_current_mortgage_rate()
        
        return {
            "rate": float(rate),
            "date": _rate_cache.get("date", "unknown") if _rate_cache else "N/A",
            "source": "FRED (Federal Reserve)" if self.api_key else "Default",
            "series": self.MORTGAGE_30_SERIES if self.api_key else None,
            "cached": _rate_cache is not None and self._is_cache_fresh()
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


# Singleton instance
_fred_service: Optional[FredRatesService] = None


def get_fred_service() -> FredRatesService:
    """Get or create FredRatesService singleton."""
    global _fred_service
    if _fred_service is None:
        _fred_service = FredRatesService()
    return _fred_service


async def get_current_mortgage_rate() -> Decimal:
    """Convenience function to get current mortgage rate.
    
    Returns:
        Current 30-year fixed mortgage rate as Decimal
    """
    service = get_fred_service()
    return await service.get_current_mortgage_rate()
