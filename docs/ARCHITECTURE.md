# HomePilot – Architecture

This document describes the high-level architecture of HomePilot: system boundaries, domain separation, API design, and deployment model.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│                    Next.js + React + TypeScript (frontend/)                  │
└───────────────────────────────────────────┬─────────────────────────────────┘
                                            │ HTTPS / REST
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / BACKEND                              │
│                         FastAPI (backend/app/)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ /api/calc   │  │ /api/profile │  │ /api/ai     │  │ OpenAPI / Swagger UI │ │
│  │ (PITI, PMI, │  │ (50/30/20,   │  │ (narratives,│  │                     │ │
│  │  amort.)    │  │  scenarios)  │  │  coaching)  │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                │                                  │
│         ▼                ▼                ▼                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                           │
│  │ calculation │  │  profile    │  │   ai_       │                           │
│  │   _engine   │  │  _modeling  │  │  services   │                           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                           │
│         │                │                │                                  │
└─────────┼────────────────┼────────────────┼──────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (persistence: profiles, scenarios, session data)                 │
│  Optional: external AI provider (OpenAI, etc.)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: Single-page experience backed by Next.js; talks to the backend via REST.
- **Backend**: Single FastAPI application with domain modules; exposes typed REST APIs and OpenAPI.
- **Data**: PostgreSQL for persisted state; calculation engine is largely stateless and deterministic.

---

## 2. Monorepo Layout

```
HomePilot/
├── frontend/                 # Next.js + TypeScript app
│   ├── app/                  # App Router pages & layouts
│   ├── components/           # UI components
│   ├── lib/                  # API client, types, utils
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers (/api/calc, /api/profile, /api/ai)
│   │   ├── calculation_engine/
│   │   ├── profile_modeling/
│   │   ├── ai_services/
│   │   ├── db/               # DB connection, migrations
│   │   ├── schemas/          # Pydantic request/response models
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── infrastructure/
│   ├── docker-compose.yml    # Local dev: frontend, backend, postgres
│   ├── .env.example
│   └── (optional) prod configs
├── docs/
│   └── ARCHITECTURE.md       # This file
└── README.md
```

- **frontend/** and **backend/** are the two main deployable units; **infrastructure/** defines how they run together (e.g. Docker Compose).

---

## 3. Backend Domain Modules

### 3.1 Calculation Engine (`calculation_engine`)

- **Responsibility**: Pure financial math. No I/O, no AI, minimal dependencies.
- **Outputs**: PITI, PMI (credit-score-based), HOA, maintenance estimates, full amortization schedules.
- **Design**:
  - Configurable loan terms (e.g. 15/20/30 years), rate, down payment, property tax rate, insurance.
  - PMI derived from LTV and credit-score bands (rule-based, extensible).
  - Amortization: per-period principal, interest, balance; hooks for extra payments / rate changes.
- **Testing**: Unit tests with fixed inputs and expected numbers; no mocks required for core logic.

### 3.2 Profile Modeling (`profile_modeling`)

- **Responsibility**: User financial profile and 50/30/20 affordability classification.
- **Concepts**: Income, fixed/optional expenses, savings targets; one or many “scenarios” (e.g. different home price, rate, term).
- **Design**:
  - Consumes calculation engine output (monthly housing cost) and compares to 50% needs / 30% wants / 20% savings.
  - Flags when housing pushes over the 50% needs cap or crowds other buckets.
  - Scenario management: create, update, compare scenarios; persistence in PostgreSQL.

### 3.3 AI Services (`ai_services`)

- **Responsibility**: AI-driven narratives, coaching, and recommendations.
- **Design**:
  - Single abstraction (e.g. `AIService` interface) with implementations for OpenAI or other providers.
  - Inputs: user profile summary, scenario summary, affordability result.
  - Outputs: natural-language explanation, trade-off summary, suggested adjustments (e.g. “increase down payment to drop PMI”).
  - All provider-specific logic (prompts, API shape) lives inside this module; API layer only passes structured data.

### 3.4 API Layer

- **Routers**: Grouped by domain — e.g. `api/calc`, `api/profile`, `api/ai`.
- **Schemas**: Pydantic models for every request and response; shared where possible (e.g. `LoanTerms`, `AffordabilityResult`).
- **OpenAPI**: Auto-generated from FastAPI; Swagger UI in dev for discovery and testing.
- **No business logic in route handlers**: Handlers validate input, call domain modules, and return schema instances.

---

## 4. API Design Principles

- **REST**: Resource-oriented URLs; GET for reads, POST for calculations and scenario creation/updates.
- **Type safety**: Request/response bodies and path/query params are Pydantic models; same concepts can drive TypeScript types (e.g. generated from OpenAPI).
- **Idempotency**: Calculation endpoints are pure functions of input; idempotent where appropriate (e.g. GET for a scenario by id).
- **Errors**: Consistent error payload (e.g. `detail`, `code`); 4xx/5xx used correctly; validation errors from Pydantic exposed in a stable shape.

---

## 5. Frontend Architecture

- **Framework**: Next.js (App Router), React, TypeScript.
- **Routes**: High-level flows — onboarding, scenario builder, affordability dashboard, amortization explorer, AI insights.
- **State**: Server state from REST stored in React state or a small data layer; minimal global client state.
- **API usage**: Dedicated `lib` modules that call FastAPI; types aligned with backend schemas (OpenAPI codegen or hand-maintained contracts).
- **UI**: Feature-oriented components (ScenarioBuilder, AffordabilityDashboard, AmortizationExplorer) that map to backend domains.

---

## 6. Data Flow (Example: “Can I afford this home?”)

1. User enters income, expenses, target home price, down payment, rate, term, HOA, etc. in the **Scenario Builder**.
2. Frontend sends a **POST** to something like `/api/calc/affordability` (or `/api/profile/scenarios` with embedded loan params) with a single payload.
3. Backend:
   - **calculation_engine**: Computes PITI, PMI, HOA, maintenance → total monthly housing cost.
   - **profile_modeling**: Applies 50/30/20 to income; compares housing cost to 50% needs bucket; returns affordability flag and breakdown.
4. Optionally, frontend calls **/api/ai/explain** with scenario id; **ai_services** returns a short narrative and suggestions.
5. Frontend renders **Affordability Dashboard** and **Amortization Explorer** (and optional AI block) from these responses.

---

## 7. Deployment & Docker

- **Containers**: One image for frontend (Node build + serve), one for backend (Python + FastAPI), one for PostgreSQL (official image).
- **Compose**: Single `docker-compose.yml` for local dev: all three services; backend and frontend point at each other and at DB via env.
- **Production**: Same images can be used; Compose or an orchestrator (e.g. Kubernetes) runs them; OpenAPI docs exposed via backend URL (e.g. `/docs`).

---

## 8. Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Monorepo | Single repo for frontend, backend, and infra; shared docs and versioning. |
| Domain separation in backend | Clear boundaries (calc vs profile vs AI) improve testability and future scaling (e.g. splitting services later). |
| Calculation engine as pure logic | Deterministic, easy to unit test and to reuse from jobs or other entrypoints. |
| Pydantic + OpenAPI | Type-safe APIs and auto-generated docs; enables shared types with frontend. |
| PostgreSQL | Structured persistence for users and scenarios; calculation results can be cached or stored as needed. |
| Dockerized services | Reproducible local and production runs; aligns with “production-ready” goal. |

---

*Last updated: 2026. For product overview and tech stack, see [README](../README.md).*
