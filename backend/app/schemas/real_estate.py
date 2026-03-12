"""Pydantic schemas for real estate listings API."""
from typing import Optional
from pydantic import BaseModel, Field


class RealEstateSearchRequest(BaseModel):
    """Search criteria for real estate listings."""
    location: str = Field(..., description="City, state, or ZIP code")
    max_price: float = Field(..., gt=0, description="Maximum home price")
    min_price: Optional[float] = Field(default=None, ge=0, description="Minimum home price")
    bedrooms: Optional[int] = Field(default=None, ge=0, description="Minimum bedrooms")
    bathrooms: Optional[int] = Field(default=None, ge=0, description="Minimum bathrooms")
    limit: int = Field(default=20, ge=1, le=50, description="Max results to return")


class PropertyListing(BaseModel):
    """Individual property listing."""
    property_id: str
    address: str
    city: str
    state: str
    zip_code: str
    price: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    lot_size: Optional[int] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    listing_url: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class AffordabilityIndicator(BaseModel):
    """Affordability analysis for a listing."""
    status: str = Field(..., description="safe, good, stretch, or risky")
    monthly_payment: float
    housing_pct_of_income: float
    is_affordable: bool
    message: str


class ListingWithAffordability(BaseModel):
    """Property listing with affordability analysis."""
    listing: PropertyListing
    affordability: AffordabilityIndicator


class RealEstateSearchResponse(BaseModel):
    """Response containing listings with affordability analysis."""
    listings: list[ListingWithAffordability]
    total_found: int
    search_location: str
