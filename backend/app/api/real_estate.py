"""Real estate listings API endpoints."""
import logging
from fastapi import APIRouter, HTTPException
from decimal import Decimal

from app.schemas.real_estate import (
    RealEstateSearchRequest,
    RealEstateSearchResponse,
    ListingWithAffordability,
)
from app.real_estate_services.rapidapi import real_estate_service
from app.real_estate_services.affordability import analyze_listing_affordability
from app.real_estate_services.fred_rates import get_current_mortgage_rate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/current-rate")
async def get_mortgage_rate():
    """Get current 30-year fixed mortgage rate from FRED.
    
    Returns:
        Current mortgage rate with metadata
    """
    try:
        from app.real_estate_services.fred_rates import get_fred_service
        service = get_fred_service()
        metadata = await service.get_rate_metadata()
        return metadata
    except Exception as e:
        logger.error(f"Error fetching mortgage rate: {e}")
        return {
            "rate": 6.5,
            "source": "Default (error fetching from FRED)",
            "error": str(e)
        }


@router.post("/search")
async def search_listings(req: RealEstateSearchRequest) -> RealEstateSearchResponse:
    """
    Search for real estate listings with affordability analysis.
    
    This endpoint requires user financial profile to calculate affordability.
    For now, we'll use default values. In production, this would come from
    the authenticated user's profile.
    """
    # TODO (Future Enhancement - Authentication Required):
    # Replace demo defaults with authenticated user's profile data:
    # 1. Add JWT/session authentication to endpoints
    # 2. Retrieve user profile from database (monthly_income, down_payment_pct, etc.)
    # 3. Use /api/v1/real-estate/search-with-profile endpoint for custom parameters
    # For demo: use reasonable defaults
    monthly_income = req.max_price * 0.005  # Rule of thumb: home price ~200x monthly income
    annual_income = monthly_income * 12
    down_payment_pct = 20.0
    
    # Fetch current mortgage rate from FRED (falls back to 6.5% if API unavailable)
    interest_rate_decimal = await get_current_mortgage_rate()
    interest_rate = float(interest_rate_decimal)
    
    term_years = 30
    property_tax_rate = 1.2
    insurance_annual = 1200.0
    hoa_monthly = 0.0
    
    try:
        # Fetch listings from RapidAPI
        listings = await real_estate_service.search_properties(
            location=req.location,
            max_price=req.max_price,
            min_price=req.min_price,
            bedrooms=req.bedrooms,
            bathrooms=req.bathrooms,
            limit=req.limit
        )
        
        # Analyze affordability for each listing
        listings_with_affordability = []
        for listing in listings:
            try:
                affordability = analyze_listing_affordability(
                    home_price=listing.price,
                    down_payment_pct=down_payment_pct,
                    interest_rate=interest_rate,
                    term_years=term_years,
                    property_tax_rate=property_tax_rate,
                    insurance_annual=insurance_annual,
                    hoa_monthly=hoa_monthly,
                    monthly_income=monthly_income,
                    annual_income=annual_income
                )
                
                listings_with_affordability.append(
                    ListingWithAffordability(
                        listing=listing,
                        affordability=affordability
                    )
                )
            except Exception as listing_error:
                logger.error(f"Error analyzing affordability for listing {listing.property_id}: {str(listing_error)}", exc_info=True)
                # Skip listings that can't be analyzed
                continue
        
        # Sort by affordability (safe first, then by price)
        status_order = {"safe": 0, "good": 1, "stretch": 2, "risky": 3}
        listings_with_affordability.sort(
            key=lambda x: (status_order.get(x.affordability.status, 4), x.listing.price)
        )
        
        return RealEstateSearchResponse(
            listings=listings_with_affordability,
            total_found=len(listings_with_affordability),
            search_location=req.location
        )
        
    except Exception as e:
        logger.error(f"Error in search_listings: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Unable to search for homes. Please check your search criteria and try again."
        )


@router.post("/search-with-profile")
async def search_listings_with_profile(
    req: RealEstateSearchRequest,
    monthly_income: float,
    annual_income: float,
    down_payment_pct: float = 20.0,
    interest_rate: float = 6.5,
    term_years: int = 30,
    property_tax_rate: float = 1.2,
    insurance_annual: float = 1200.0,
    hoa_monthly: float = 0.0
) -> RealEstateSearchResponse:
    """
    Search for listings with custom financial profile.
    
    This version allows passing all financial parameters directly.
    """
    try:
        # Fetch listings from RapidAPI
        listings = await real_estate_service.search_properties(
            location=req.location,
            max_price=req.max_price,
            min_price=req.min_price,
            bedrooms=req.bedrooms,
            bathrooms=req.bathrooms,
            limit=req.limit
        )
        
        # Analyze affordability for each listing
        listings_with_affordability = []
        for listing in listings:
            try:
                affordability = analyze_listing_affordability(
                    home_price=listing.price,
                    down_payment_pct=down_payment_pct,
                    interest_rate=interest_rate,
                    term_years=term_years,
                    property_tax_rate=property_tax_rate,
                    insurance_annual=insurance_annual,
                    hoa_monthly=hoa_monthly,
                    monthly_income=monthly_income,
                    annual_income=annual_income
                )
                
                listings_with_affordability.append(
                    ListingWithAffordability(
                        listing=listing,
                        affordability=affordability
                    )
                )
            except Exception as listing_error:
                logger.error(f"Error analyzing affordability for listing {listing.property_id}: {str(listing_error)}", exc_info=True)
                # Skip listings that can't be analyzed
                continue
        
        # Sort by affordability (safe first, then by price)
        status_order = {"safe": 0, "good": 1, "stretch": 2, "risky": 3}
        listings_with_affordability.sort(
            key=lambda x: (status_order.get(x.affordability.status, 4), x.listing.price)
        )
        
        return RealEstateSearchResponse(
            listings=listings_with_affordability,
            total_found=len(listings_with_affordability),
            search_location=req.location
        )
        
    except Exception as e:
        logger.error(f"Error in search_listings_with_profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Unable to search for homes. Please check your search criteria and try again."
        )
