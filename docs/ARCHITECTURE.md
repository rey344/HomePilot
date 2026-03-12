# HomePilot – Architecture

System boundaries, domain separation, API design, and data flow.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│              Next.js + React + TypeScript (frontend/)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  domain/ (pure)  │  ScenarioBuilder  │  lib/api.ts  │  search/, UI      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────┬─────────────────────────────────┘
                                            │ REST (/api/v1: calc, profile, ai, real-estate)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Backend (backend/app/)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ /api/v1/    │  │ /api/v1/    │  │ /api/v1/ai  │  │ OpenAPI / Swagger   │ │
│  │ calc        │  │ profile     │  │ explain,    │  │ /docs               │ │
│  │ piti,       │  │ afford.,    │  │ chat        │  │                     │ │
│  │ amort.,     │  │ scenarios    │  │             │  │ /api/v1/real-estate │ │
│  │ analyze     │  │              │  │             │  │ rates, search       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                │                                  │
│         ▼                ▼                ▼                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │ calculation │  │  profile     │  │ ai_services │                          │
│  │   _engine    │  │  _modeling   │  │             │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (Docker) or SQLite (local dev)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key design:** The frontend has a **domain layer** (`frontend/src/domain/`) with pure TypeScript functions for mortgage and budget calculations. All UI outputs are derived from a single `calculateAffordabilitySummary(scenario)` call. The backend is used for AI explain and optional scenario persistence; core calculations can run entirely in the frontend.

---

## 2. Monorepo Layout

```
HomePilot/
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router, layout, globals.css
│   │   ├── components/
│   │   │   ├── ScenarioBuilder.tsx
│   │   │   ├── AdvisorChat.tsx
│   │   │   ├── search/       # SearchHomesView, SearchFilters, ListingCard
│   │   │   └── ui/          # Card, Button, Input, Tooltip, Toast
│   │   ├── domain/          # Pure calculations (single source of truth)
│   │   │   ├── index.ts     # calculateAffordabilitySummary, Scenario type
│   │   │   ├── mortgage.ts  # loan amount, PI, tax, insurance, PMI, amortization
│   │   │   ├── budget.ts    # 50/30/20 affordability
│   │   │   ├── listingAffordability.ts  # computeListingAffordability (Search Homes)
│   │   │   ├── round.ts     # formatCurrency, roundToCents
│   │   │   └── validate.ts  # validateScenario
│   │   ├── lib/
│   │   │   ├── api.ts       # fetchPiti, fetchExplain, fetchChat, fetchEnhancedLoanAnalysis, etc.
│   │   │   ├── searchUtils.ts  # attachAffordability, sortListings, SearchFilters type
│   │   │   ├── searchMock.ts   # getListingsForSearch (mock; swap for real API later)
│   │   │   └── validate.ts    # parseApiError
│   │   └── e2e/             # Playwright tests
│   ├── vitest.config.ts
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/              # calc, profile, ai routers
│   │   ├── calculation_engine/
│   │   ├── profile_modeling/
│   │   ├── ai_services/
│   │   ├── db/
│   │   └── schemas/
│   ├── tests/
│   └── requirements.txt
├── infrastructure/
│   └── docker-compose.yml
└── docs/
    ├── ARCHITECTURE.md
    └── DESIGN.md
```

---

## 3. Frontend Domain Layer

The **domain** module is the single source of truth for all derived outputs.

### 3.1 Scenario → Result Pipeline

```
Scenario (inputs)  →  calculateAffordabilitySummary()  →  AffordabilityResult
     │                                    │
     │                                    ├── piti (PitiBreakdown)
     │                                    ├── affordability (50/30/20)
     │                                    └── amortization (schedule)
```

- **Scenario**: `homeValue`, `downPayment`, `annualRatePercent`, `termYears`, `annualPropertyTaxPercent`, `annualInsurancePercent`, `hoaMonthly`, `annualMaintenancePercent`, `monthlyTakeHomeIncome`, `otherMonthlyNeeds`
- **Result**: PITI breakdown, affordability summary, amortization schedule (first N months)

### 3.2 Pure Functions (`domain/`)

| Function | Purpose |
|----------|---------|
| `calculateLoanAmount(homeValue, downPayment)` | Loan amount |
| `calculateMonthlyPI(loanAmount, rate, termYears)` | Principal + interest |
| `calculateMonthlyPropertyTax`, `calculateMonthlyInsurance`, `calculateMonthlyMaintenance` | Tax, insurance, maintenance |
| `calculateMonthlyPMI(loanAmount, homeValue)` | PMI (0 when LTV ≤ 80%) |
| `amortizationSchedule(...)` | Per-month principal, interest, balance |
| `calculateAffordability(income, housing, otherNeeds)` | 50/30/20 summary |
| `validateScenario(scenario)` | Strict validation, no coercion |

### 3.3 ScenarioBuilder UX

- **Raw string state** for inputs (avoids "zero sticky" bug); parse only on blur and Calculate
- **Single compute** on "Calculate" click; all cards (monthly cost, 50/30/20, amortization) read from one `result`
- **Validation** blocks Calculate when invalid; shows per-field errors
- **AI explain** fetched from backend after compute; optional

---

## 4. Backend Domain Modules

### 4.1 Calculation Engine (`calculation_engine`)

- PITI, PMI (LTV bands), HOA, maintenance, amortization
- Pure logic; unit-tested

### 4.2 Profile Modeling (`profile_modeling`)

- 50/30/20 affordability
- Scenario CRUD (PostgreSQL)

### 4.3 AI Services (`ai_services`)

- `explain_affordability()` – narrative and suggestions
- Uses `housing + other_needs` vs 50% needs budget (no logical inconsistency)

### 4.4 API Layer

- `/api/v1/calc/piti`, `/api/v1/calc/amortization`, `/api/v1/calc/analyze` (enhanced loan analysis)
- `/api/v1/profile/affordability`, `/api/v1/profile/scenarios`, `/api/v1/profile/recommend-home-price`
- `/api/v1/ai/explain`, `/api/v1/ai/chat` (scenario-aware advisor)
- `/api/v1/real-estate/current-rate` (FRED), `/api/v1/real-estate/search`, `/api/v1/real-estate/search-with-profile`
- Pydantic schemas; OpenAPI at `/docs`

---

## 5. Data Flow: "Can I Afford This Home?"

1. User enters inputs in **ScenarioBuilder** (raw string state).
2. On "Calculate", frontend parses and validates; if valid, calls `calculateAffordabilitySummary(scenario)`.
3. UI renders **Monthly housing cost**, **50/30/20 budget**, **Amortization** from `result`.
4. Frontend optionally calls `POST /api/v1/ai/explain` (and `POST /api/v1/ai/chat` for advisor) with affordability/risk/projection context; renders **AI insights**.
5. **Search Homes**: Listings come from a data layer (`getListingsForSearch` in `searchMock.ts`); each listing gets affordability via `computeListingAffordability()` (same 50/30/20 logic). Ready to swap mock for a real listings API in one place.
6. All outputs are consistent (single source of truth).

---

## 6. Deployment

- **Docker Compose**: Postgres, backend (9001), frontend (9002)
- **Local dev**: Backend with SQLite on 9001, frontend on 9002; no Docker required

---

*For design system (colors, typography, components), see [DESIGN.md](DESIGN.md).*
