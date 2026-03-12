# Real Estate & Search Homes

Search for homes and see affordability analysis based on your financial profile. Uses the same 50/30/20 logic as the calculator.

## Overview

- **Search Homes page** (`/search-homes`): Two-column layout (filters left, results right). Listings are currently supplied by **mock data** (`frontend/src/lib/searchMock.ts`). Each listing gets an affordability tier and estimated monthly payment via shared domain logic; the UI is built so a real listings API can be connected later with minimal change.
- **Backend real-estate API** (optional): FRED rates and RapidAPI-based search endpoints exist for when you want live data. The frontend Search Homes flow does not call them by default; it uses `getListingsForSearch()` which you can replace with an API client that returns the same `RawListing[]` shape.

## Features

- **Search Homes UI**: Filters (location, price range, beds, baths, down %, rate, term, tax, insurance, HOA, maintenance, take-home income, other needs, “only in safe range”). Sort by price, payment, affordability, newest. Listing cards show image, price, beds/baths/sqft, est. monthly payment, and **affordability badge** (Safe / Stretch / Over budget) with short explanation.
- **Affordability logic**: Reuses the calculator’s 50/30/20 model. Implemented in `frontend/src/domain/listingAffordability.ts` — `computeListingAffordability()` returns total monthly (P&I, tax, insurance, PMI, HOA, maintenance) and an affordability summary. `frontend/src/lib/searchUtils.ts` maps that to tiers and explanation text.
- **Tiers**: Based on housing share of income and 50% needs budget:
  - **Safe** — within recommended range (green).
  - **Stretch** — above target but under 50% needs (warning).
  - **Over budget** — exceeds 50% needs (danger).

## Architecture

### Frontend

| Area | Purpose |
|------|---------|
| `src/domain/listingAffordability.ts` | `computeListingAffordability()` — same P&I, tax, insurance, PMI, HOA, maintenance and 50/30/20 as calculator |
| `src/lib/searchUtils.ts` | `attachAffordability()`, `sortListings()`, `SearchFilters` type, `ListingWithAffordability` |
| `src/lib/searchMock.ts` | `getListingsForSearch(filters)` — returns mock listings; **single swap point** for a real API |
| `src/components/search/SearchHomesView.tsx` | Two-column layout; calls `getListingsForSearch` → `attachAffordability` → filter → sort |
| `src/components/search/SearchFilters.tsx` | Filter form (Card, Input, Button from design system) |
| `src/components/search/ListingCard.tsx` | Single listing card with theme-based badges and `formatCurrency` |

To connect a real listings API: implement a function that returns `Promise<RawListing[]>` (same shape as mock) and use it instead of `getListingsForSearch` in the data layer (e.g. in `searchMock.ts` or a new `searchApi.ts`). No change to SearchHomesView, SearchFilters, or ListingCard beyond the data source.

### Backend (optional)

- **`GET /api/v1/real-estate/current-rate`** — 30-year rate from FRED (see [FRED_INTEGRATION.md](FRED_INTEGRATION.md)).
- **`POST /api/v1/real-estate/search`** — Listings with default financial assumptions.
- **`POST /api/v1/real-estate/search-with-profile`** — Listings with custom income, down payment, rate, etc.

Backend uses `real_estate_services/` (FRED, RapidAPI) and `schemas/real_estate.py`. Frontend Search Homes does not call these by default; it uses mock data for polish and recruiter demos. When you add a real API, the frontend can call these endpoints and map responses to `RawListing[]`, or use a different provider.

## Setup

### Frontend (Search Homes with mock data)

No API keys required. From repo root:

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:9002/search-homes**. Set filters and click “Search homes” to see mock listings with affordability badges.

### Backend (live rates + optional listing APIs)

1. **FRED (rates):** Add `FRED_API_KEY` to `infrastructure/.env` (see [FRED_INTEGRATION.md](FRED_INTEGRATION.md)). Frontend calculator can call `GET /api/v1/real-estate/current-rate` for the rate.
2. **RapidAPI (listings):** Add `RAPIDAPI_KEY` to use backend search endpoints with live data. Without it, backend search still returns sample data.

## API (backend) reference

### GET `/api/v1/real-estate/current-rate`

Returns current 30-year fixed rate (FRED or default).

### POST `/api/v1/real-estate/search`

Request body: `location`, `max_price`, `min_price`, `bedrooms`, `bathrooms`, `limit`, etc.  
Response: `listings[]` with listing + affordability (status, monthly_payment, housing_pct_of_income, message).

### POST `/api/v1/real-estate/search-with-profile`

Same as search but with query/body params for monthly_income, down_payment_pct, interest_rate, term_years, property_tax_rate, insurance, hoa_monthly.

Backend affordability uses its own calculation engine; status bands may differ slightly from the frontend 50/30/20 tiers (Safe / Stretch / Over budget). For a unified experience, the frontend Search Homes flow uses domain `computeListingAffordability()` and mock (or a future API that returns raw listing fields for the frontend to score).

## Testing

```bash
# Backend
cd backend && pytest tests/test_api_real_estate.py -v

# Frontend (unit tests for domain/search utils as needed)
cd frontend && npm test
```

## Future work

- Replace `getListingsForSearch()` with a real listings API (backend search-with-profile or another provider).
- Optional: sync backend affordability bands with frontend 50/30/20 tiers if both are used.
- Auth and saved profiles so Search Homes pre-fills income and assumptions.
- Favorites, alerts, map view, comparison tool.
