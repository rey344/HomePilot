"""RapidAPI Real Estate API integration."""
import os
import logging
from typing import Optional
import httpx

from app.schemas.real_estate import PropertyListing

logger = logging.getLogger(__name__)


class RapidAPIRealEstateService:
    """Service for fetching real estate listings from RapidAPI."""
    
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY", "")
        self.base_url = "https://realty-in-us.p.rapidapi.com"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "realty-in-us.p.rapidapi.com"
        }
        
    async def search_properties(
        self,
        location: str,
        max_price: float,
        min_price: Optional[float] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[int] = None,
        limit: int = 20
    ) -> list[PropertyListing]:
        """
        Search for properties using RapidAPI.
        
        Args:
            location: City, state, or ZIP code
            max_price: Maximum home price
            min_price: Minimum home price
            bedrooms: Minimum bedrooms
            bathrooms: Minimum bathrooms
            limit: Maximum results to return
            
        Returns:
            List of property listings
        """
        if not self.api_key:
            logger.warning("RAPIDAPI_KEY not configured, returning sample data")
            return self._get_sample_listings(location, max_price, limit)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "location": location,
                    "status": "for_sale",
                    "limit": limit
                }
                
                if max_price:
                    params["price_max"] = int(max_price)
                if min_price:
                    params["price_min"] = int(min_price)
                if bedrooms:
                    params["beds_min"] = bedrooms
                if bathrooms:
                    params["baths_min"] = bathrooms
                
                response = await client.get(
                    f"{self.base_url}/properties/list-for-sale",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code != 200:
                    logger.error(f"RapidAPI error: {response.status_code} - {response.text}")
                    return self._get_sample_listings(location, max_price, limit)
                
                data = response.json()
                return self._parse_listings(data)
                
        except Exception as e:
            logger.error(f"Error fetching listings from RapidAPI: {e}")
            return self._get_sample_listings(location, max_price, limit)
    
    def _parse_listings(self, data: dict) -> list[PropertyListing]:
        """Parse RapidAPI response into PropertyListing objects."""
        listings = []
        
        properties = data.get("listings", [])
        if not properties:
            properties = data.get("data", {}).get("results", [])
        
        for prop in properties:
            try:
                # Handle various response formats from RapidAPI
                address_str = prop.get("location", {}).get("address", {}).get("line", "")
                if not address_str:
                    address_str = prop.get("address", "")
                
                listing = PropertyListing(
                    property_id=str(prop.get("property_id", prop.get("id", ""))),
                    address=address_str,
                    city=prop.get("location", {}).get("address", {}).get("city", prop.get("city", "")),
                    state=prop.get("location", {}).get("address", {}).get("state", prop.get("state", "")),
                    zip_code=prop.get("location", {}).get("address", {}).get("postal_code", prop.get("zip_code", "")),
                    price=float(prop.get("list_price", prop.get("price", 0))),
                    bedrooms=prop.get("description", {}).get("beds", prop.get("bedrooms")),
                    bathrooms=prop.get("description", {}).get("baths", prop.get("bathrooms")),
                    sqft=prop.get("description", {}).get("sqft", prop.get("sqft")),
                    lot_size=prop.get("description", {}).get("lot_sqft"),
                    year_built=prop.get("description", {}).get("year_built", prop.get("year_built")),
                    property_type=prop.get("description", {}).get("type", prop.get("property_type", "house")),
                    listing_url=prop.get("href", prop.get("url")),
                    image_url=prop.get("primary_photo", {}).get("href", prop.get("image_url")),
                    description=prop.get("description", {}).get("text", "")[:500] if prop.get("description") else None
                )
                listings.append(listing)
            except Exception as e:
                logger.warning(f"Error parsing listing: {e}")
                continue
        
        return listings
    
    def _get_sample_listings(self, location: str, max_price: float, limit: int) -> list[PropertyListing]:
        """Return sample listings for demo purposes when API is not configured."""
        logger.info(f"Returning sample listings for {location}")
        
        sample_data = [
            {
                "property_id": "demo_1",
                "address": "123 Main Street",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94102",
                "price": min(385000, max_price * 0.8),
                "bedrooms": 3,
                "bathrooms": 2.0,
                "sqft": 1650,
                "year_built": 2010,
                "property_type": "Single Family",
                "image_url": "https://via.placeholder.com/400x300?text=Sample+Home+1",
                "description": "Beautiful home in prime location with modern updates"
            },
            {
                "property_id": "demo_2",
                "address": "456 Oak Avenue",
                "city": "Oakland",
                "state": "CA",
                "zip_code": "94601",
                "price": min(420000, max_price * 0.85),
                "bedrooms": 4,
                "bathrooms": 2.5,
                "sqft": 1850,
                "year_built": 2015,
                "property_type": "Single Family",
                "image_url": "https://via.placeholder.com/400x300?text=Sample+Home+2",
                "description": "Spacious family home with great backyard"
            },
            {
                "property_id": "demo_3",
                "address": "789 Pine Court",
                "city": "Berkeley",
                "state": "CA",
                "zip_code": "94704",
                "price": min(475000, max_price * 0.95),
                "bedrooms": 3,
                "bathrooms": 2.5,
                "sqft": 1950,
                "year_built": 2018,
                "property_type": "Townhouse",
                "image_url": "https://via.placeholder.com/400x300?text=Sample+Home+3",
                "description": "Modern townhouse close to transit and shopping"
            },
            {
                "property_id": "demo_4",
                "address": "321 Elm Street",
                "city": "San Jose",
                "state": "CA",
                "zip_code": "95110",
                "price": min(350000, max_price * 0.70),
                "bedrooms": 2,
                "bathrooms": 2.0,
                "sqft": 1200,
                "year_built": 2005,
                "property_type": "Condo",
                "image_url": "https://via.placeholder.com/400x300?text=Sample+Home+4",
                "description": "Cozy condo perfect for first-time buyers"
            },
            {
                "property_id": "demo_5",
                "address": "555 Maple Drive",
                "city": "Fremont",
                "state": "CA",
                "zip_code": "94538",
                "price": min(499000, max_price),
                "bedrooms": 4,
                "bathrooms": 3.0,
                "sqft": 2200,
                "year_built": 2020,
                "property_type": "Single Family",
                "image_url": "https://via.placeholder.com/400x300?text=Sample+Home+5",
                "description": "Newly built home with all the modern amenities"
            }
        ]
        
        # Filter by max price and limit
        filtered = [prop for prop in sample_data if prop["price"] <= max_price][:limit]
        
        return [PropertyListing(**prop) for prop in filtered]


# Global service instance
real_estate_service = RapidAPIRealEstateService()
