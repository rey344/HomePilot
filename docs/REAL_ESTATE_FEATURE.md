# Real Estate & Search Homes

Search for homes and see affordability analysis based on your financial profile. The backend uses the same 50/30/20 logic as the calculator; listings are tagged Safe / Good / Stretch / Risky.

## Overview

- **Search Homes page** (`/search`): Form for location, max price, income, down payment %, and rate. Submits to the backend; results show listings with affordability badges and estimated monthly payment.
- **Backend real-estate API**: FRED for current mortgage rate; RapidAPI for listings (with fallback when key is unset). Two search endpoints: `search` (default profile) and `search-with-profile` (custom income, rate, etc.).

## Features

- **Search form**: Location, max price, monthly/annual income, down payment %, interest rate. Required fields validated before submit.
- **Listings with affordability**: Each listing shows price, address, beds/baths/sqft, estimated monthly payment, and status badge (Safe / Good / Stretch / Risky) with short message.
- **Backend tiers**: Based on housing share of income and 50% needs budget — Safe (green), Good (blue), Stretch (yellow), Risky (red). Design tokens align with app theme.

## Architecture

### Frontend

| Area | Purpose |
|------|---------|
| `src/components/RealEstateSearch.tsx` | Search form and results list; calls `searchRealEstateWithProfile()` from api.ts |
| `src/lib/api.ts` | `searchRealEstate()`, `searchRealEstateWithProfile()` — POST to `/api/v1/real-estate/search` and `search-with-profile` |
| `src/app/search/page.tsx` | Route that renders RealEstateSearch (nav: "Search Homes") |

### Backend

- **`GET /api/v1/real-estate/current-rate`** — 30-year rate from FRED (see [FRED_INTEGRATION.md](FRED_INTEGRATION.md)).
- **`POST /api/v1/real-estate/search`** — Listings with default financial assumptions.
- **`POST /api/v1/real-estate/search-with-profile`** — Listings with custom income, down payment %, rate, term, property tax, insurance, HOA (query params + body).

Backend uses `real_estate_services/` (FRED, RapidAPI) and `schemas/real_estate.py`. Affordability is computed per listing using the same engine as the calculator.

## Demo / sample data (intentional)

When **`RAPIDAPI_KEY`** is not set, the backend returns **sample listings** so the search flow is testable without an API key. This is intentional and documented:

- **Backend:** `real_estate_services/rapidapi.py` checks `RAPIDAPI_KEY`; if empty, it returns a fixed set of sample listings (California-area placeholder data) instead of calling RapidAPI. No fake data is generated on the frontend.
- **Frontend:** The same UI and affordability logic run for both live and sample results; the user sees real affordability badges and monthly payment estimates. There is no separate "mock mode" toggle in the UI—demo mode is determined solely by the backend env.

To use **live listings**, set `RAPIDAPI_KEY` in `infrastructure/.env` (or the environment where the backend runs).

## Setup

### Frontend (Search Homes)

Backend must be running. From repo root:

```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:9002/search**. Use the nav "Search Homes". Enter location, max price, income, and optional rate/down %; click "Search listings". Backend returns listings (RapidAPI if `RAPIDAPI_KEY` is set, otherwise sample data per above).

### Backend (live rates + listings)

1. **FRED (rates):** Add `FRED_API_KEY` to `infrastructure/.env` (see [FRED_INTEGRATION.md](FRED_INTEGRATION.md)). Backend endpoint `GET /api/v1/real-estate/current-rate` returns the current rate; the calculator uses a user-entered rate (no auto-fill from FRED in the UI today).
2. **RapidAPI (listings):** Add `RAPIDAPI_KEY` to use live listing data. Without it, the backend returns intentional sample data (see Demo / sample data).

## API reference

### GET `/api/v1/real-estate/current-rate`

Returns current 30-year fixed rate (FRED or default).

### POST `/api/v1/real-estate/search`

Request body: `location`, `max_price`, `min_price`, `bedrooms`, `bathrooms`, `limit`. Backend uses default profile (derived from max_price). Response: `listings[]` with listing + affordability (status, monthly_payment, message).

### POST `/api/v1/real-estate/search-with-profile`

Same as search; financial profile passed as **query params**: `monthly_income`, `annual_income`, `down_payment_pct`, `interest_rate`, `term_years`, `property_tax_rate`, `insurance_annual`, `hoa_monthly`. Request **body**: same search filters (`location`, `max_price`, `min_price`, `bedrooms`, `bathrooms`, `limit`). The frontend (`api.ts`) calls this endpoint with body + query params in this format; no mismatch.

## Testing

```bash
# Backend
cd backend && pytest tests/test_api_real_estate.py -v

# Frontend unit tests
cd frontend && npm test

# E2E (covers calculator; add search flow as needed)
cd frontend && npx playwright test
```

## Future work

- Pre-fill search from calculator scenario (e.g. link from results with income/rate).
- Auth and saved profiles so Search Homes can pre-fill from user profile.
- Favorites, alerts, map view, comparison tool.
