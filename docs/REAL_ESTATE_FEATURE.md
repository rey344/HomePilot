# Real Estate Listing Integration

A powerful feature that allows users to search for homes and instantly see affordability analysis based on their financial profile.

## Overview

This feature integrates real estate listings from RapidAPI and combines them with HomePilot's affordability calculations to provide instant feedback on which homes fit within a buyer's budget.

## Features

- **Real-Time Listing Search**: Search homes by location (city, state, or ZIP code)
- **Instant Affordability Analysis**: Each listing shows:
  - Monthly payment estimate
  - Housing cost as % of income
  - Affordability status: Safe, Good, Stretch, or Risky
- **Customizable Parameters**: Set your own down payment %, interest rate, and income
- **Sample Data Fallback**: Works without API key (uses demo data for testing)

## Architecture

### Backend (`/backend`)

#### New Files Created:
1. **`app/schemas/real_estate.py`**: Pydantic models for requests/responses
   - `RealEstateSearchRequest`: Search criteria
   - `PropertyListing`: Individual home listing
   - `AffordabilityIndicator`: Affordability analysis result
   - `ListingWithAffordability`: Combined listing + affordability
   - `RealEstateSearchResponse`: Full search response

2. **`app/real_estate_services/rapidapi.py`**: RapidAPI integration
   - `RapidAPIRealEstateService`: Service class for fetching listings
   - Fallback to sample data when no API key configured
   - Handles various response formats from RapidAPI

3. **`app/real_estate_services/affordability.py`**: Affordability analyzer
   - `analyze_listing_affordability()`: Calculates if a listing is affordable
   - Uses existing PITI and PMI calculation engines
   - Returns status (safe/good/stretch/risky) based on housing % of income

4. **`app/api/real_estate.py`**: FastAPI endpoints
   - `POST /api/v1/real-estate/search`: Basic search with default profile
   - `POST /api/v1/real-estate/search-with-profile`: Search with custom financial params

#### Modifications:
- **`app/main.py`**: Added real_estate router registration
- **`infrastructure/.env.example`**: Added RAPIDAPI_KEY documentation

### Frontend (`/frontend`)

#### New Files Created:
1. **`src/components/RealEstateSearch.tsx`**: Main search component
   - Search form with location, price, income inputs
   - Results display with affordability indicators
   - Color-coded status badges (green/blue/yellow/red)
   - Property details (beds, baths, sqft, etc.)

2. **`src/app/search-homes/page.tsx`**: Dedicated search page

#### Modifications:
- **`src/lib/api.ts`**: Added API client functions:
  - `searchRealEstate()`: Basic search
  - `searchRealEstateWithProfile()`: Search with financial profile
  - Type definitions for listing data structures
- **`src/app/page.tsx`**: Added navigation header with link to Search Homes

## Setup

### 1. RapidAPI Configuration (Optional)

To use live real estate data:

1. Sign up at [RapidAPI.com](https://rapidapi.com)
2. Subscribe to "Realty in US" API
3. Copy your API key
4. Add to your `.env` file:
   ```
   RAPIDAPI_KEY=your_api_key_here
   ```

**Note**: Without an API key, the feature works with sample demo data.

### 2. Backend Setup

```bash
cd backend
source .venv/bin/activate
# API key is optional - works with demo data if not set
python -m uvicorn app.main:app --host 0.0.0.0 --port 9001 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000/search-homes

## Usage

1. **Navigate** to "Search Homes" from the main page
2. **Enter** your financial details:
   - Monthly take-home income
   - Annual gross income
   - Maximum price you're willing to search
   - Location (city, state, or ZIP)
3. **Customize** (optional):
   - Down payment percentage (default: 20%)
   - Interest rate (default: 6.5%)
4. **Click** "Search Listings"
5. **Review** results sorted by affordability:
   - **Safe** (green): < 25% of income
   - **Good** (blue): 25-30% of income
   - **Stretch** (yellow): 30-35% of income
   - **Risky** (red): > 35% of income

## API Endpoints

### POST `/api/v1/real-estate/search`
Search listings with default financial assumptions.

**Request Body:**
```json
{
  "location": "San Francisco, CA",
  "max_price": 500000,
  "min_price": 300000,
  "bedrooms": 2,
  "bathrooms": 2,
  "limit": 20
}
```

**Response:**
```json
{
  "listings": [
    {
      "listing": {
        "property_id": "123",
        "address": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94102",
        "price": 450000,
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1650
      },
      "affordability": {
        "status": "good",
        "monthly_payment": 2847.50,
        "housing_pct_of_income": 28.5,
        "is_affordable": true,
        "message": "Comfortable fit at 28.5% of income"
      }
    }
  ],
  "total_found": 5,
  "search_location": "San Francisco, CA"
}
```

### POST `/api/v1/real-estate/search-with-profile`
Search with custom financial parameters (via query string and request body).

**Query Parameters:**
- `monthly_income`: Monthly take-home income
- `annual_income`: Annual gross income
- `down_payment_pct`: Down payment % (default: 20)
- `interest_rate`: Interest rate % (default: 6.5)
- `term_years`: Loan term (default: 30)
- `property_tax_rate`: Property tax % (default: 1.2)
- `insurance_annual`: Annual insurance $ (default: 1200)
- `hoa_monthly`: Monthly HOA $ (default: 0)

**Request Body:** Same as `/search` endpoint

## Affordability Calculation Logic

The system uses HomePilot's proven calculation engine:

1. **PITI Calculation**: Principal, Interest, Taxes, Insurance
2. **PMI Calculation**: Private Mortgage Insurance (if down payment < 20%)
3. **Total Monthly Payment**: PITI + PMI + HOA
4. **Housing % of Income**: `(Monthly Payment / Monthly Income) × 100`
5. **Status Determination**:
   - Safe: < 25%
   - Good: 25-30%
   - Stretch: 30-35%
   - Risky: > 35%

## Development Notes

- **Sample Data**: 5 demo listings returned when RAPIDAPI_KEY not configured
- **Error Handling**: Graceful fallback to sample data on API errors
- **Type Safety**: Full TypeScript types for all API responses
- **Reusable Logic**: Leverages existing calculation_engine modules

## Future Enhancements

- [ ] **User authentication & personalized profiles**: Replace demo defaults with authenticated user's financial profile (monthly income, down payment %, etc.) - see TODO in `app/api/real_estate.py`
- [ ] Favorite/save listings functionality
- [ ] Email alerts for new listings
- [ ] Map view integration
- [ ] Detailed property page with full HomePilot breakdown
- [ ] Comparison tool (side-by-side listings)
- [ ] Historical price trends
- [ ] Neighborhood insights

## Testing

```bash
# Backend tests
cd backend
pytest tests/test_api_real_estate.py

# Frontend tests
cd frontend
npm test -- RealEstateSearch
```

## Dependencies

- **Backend**: `httpx` (already in requirements.txt)
- **Frontend**: No new dependencies

## Portfolio Impact

This feature demonstrates:
- ✅ **API Integration**: Third-party data source (RapidAPI)
- ✅ **Complex Data Transformation**: Parsing and standardizing external data
- ✅ **Business Logic**: Sophisticated affordability calculations
- ✅ **User Experience**: Real-world practical application
- ✅ **Error Handling**: Graceful degradation with fallback data
- ✅ **Scalability**: Service layer pattern for easy API swapping
