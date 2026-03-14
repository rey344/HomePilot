# HomePilot

A full-stack web app that helps users understand home affordability: monthly cost breakdown (PITI, PMI, HOA, maintenance), 50/30/20 budget fit, risk indicators, 5-year equity projection, and property search with affordability badges. Built with Next.js and FastAPI.

---

## What this project does

- **Calculator** — User enters home value, down payment, rate, term, property costs, and income. The app computes true monthly housing cost, shows how it fits the 50/30/20 budget, and displays risk indicators and a 5-year projection. Optional AI narrative and suggestions (Groq) plus a scenario-aware chat advisor.
- **Search Homes** — User enters location, max price, and income. The backend returns listings (RapidAPI when configured; otherwise sample data). Each listing is tagged with an affordability badge (Safe / Good / Stretch / Risky) using the same 50/30/20 logic as the calculator.
- **Advisor** — Standalone chat for affordability questions; can be opened from the calculator with current scenario context for personalized advice.

All calculator math (PITI, PMI, affordability, amortization) lives in a pure frontend domain layer and is also implemented on the backend for API consumers and for listing affordability.

---

## Key technical highlights

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript. Pure domain layer (`frontend/src/domain/`) for mortgage and budget math; single pipeline from scenario inputs to result. Shared design system (dark theme, tokens) and reusable components.
- **Backend:** FastAPI, Pydantic v2. Separate modules for calculation engine, profile modeling (affordability, recommendations), AI (Groq + rule-based fallback), and real-estate (FRED rates, RapidAPI listings). OpenAPI at `/docs`.
- **Data flow:** Calculator runs locally; backend used for AI explain/chat, home-price recommendation, and property search. No auth; scenarios can be saved to localStorage.
- **External integrations:** FRED (mortgage rate), RapidAPI (listings). Each is optional; app works without API keys (fallbacks documented in [docs/REAL_ESTATE_FEATURE.md](docs/REAL_ESTATE_FEATURE.md) and [docs/FRED_INTEGRATION.md](docs/FRED_INTEGRATION.md)).

---

## Architecture overview

```
Frontend (Next.js)          Backend (FastAPI)
─────────────────           ─────────────────
app/ (/, /search, /advisor)  api/ (calc, profile, ai, real-estate)
components/                  calculation_engine/, profile_modeling/
domain/ (pure TS math)       ai_services/, real_estate_services/
lib/ (api client)            db/, schemas/
         │                              │
         └────── REST /api/v1 ──────────┘
```

- **Implemented now:** Three main routes (Calculator, Search Homes, Advisor). Frontend domain drives calculator UI; backend provides AI, recommendations, and listing search with per-listing affordability.
- **Docs:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries, domain separation, and data flow. [docs/DESIGN.md](docs/DESIGN.md) for the design system.

---

## How to run it locally

**Prerequisites:** Node.js 18+, Python 3.11+, pip.

**Option A — No Docker (fastest, recommended for first-time run):**

No `.env` files are required. The backend needs `DATABASE_URL` in the shell; the frontend defaults to `http://localhost:9001`.

```bash
# Terminal 1 — backend (SQLite in memory)
cd backend && pip install -r requirements.txt
DATABASE_URL=sqlite:///:memory: uvicorn app.main:app --reload --port 9001

# Terminal 2 — frontend (from repo root)
cd frontend && npm install && npm run dev
```

- **App:** http://localhost:9002  
- **API docs:** http://localhost:9001/docs  
- **Health check:** http://localhost:9001/health  

**Option B — Docker (PostgreSQL):**

```bash
./infrastructure/setup-local-env.sh   # generates infrastructure/.env with a random DB password
docker compose -f infrastructure/docker-compose.yml up --build -d
```

Same URLs. If you skip the script, copy `infrastructure/.env.example` to `infrastructure/.env` and set `POSTGRES_PASSWORD` and `DATABASE_URL` (see [docs/ENV.md](docs/ENV.md)).

**Optional APIs (app works without them):** The app runs fully without any API keys. Set them only if you want live data:

| Variable | Purpose | When unset |
|----------|---------|------------|
| `GROQ_API_KEY` | AI narrative and Advisor chat | Rule-based responses |
| `FRED_API_KEY` | Current 30-year mortgage rate | Backend uses default rate |
| `RAPIDAPI_KEY` | Property listings | Backend returns sample listings |

See [docs/ENV.md](docs/ENV.md) for all variables and [docs/REAL_ESTATE_FEATURE.md](docs/REAL_ESTATE_FEATURE.md) / [docs/FRED_INTEGRATION.md](docs/FRED_INTEGRATION.md) for behavior details.

**Troubleshooting (local run):**
- **Frontend can’t reach backend** — Ensure backend is running on port 9001 and open http://localhost:9001/health. If you use a different port, set `NEXT_PUBLIC_API_URL` (e.g. in `frontend/.env.local`; see `frontend/.env.local.example`).
- **Backend won’t start** — `DATABASE_URL` is required. For Option A use the exact command above; for Option B use the setup script or a valid `infrastructure/.env`.

---

## Demo walkthrough

1. **Calculator** — Open http://localhost:9002. Enter home value, down payment, rate, term, property tax/insurance, income, and other needs. Click *Calculate*. You’ll see monthly cost, 50/30/20 budget, risk indicators, 5-year projection, and (if backend is up) insights. Use *Ask Advisor* to open the chat with scenario context. Use *Search homes in your budget* to jump to Search.
2. **Search Homes** — Open http://localhost:9002/search (or the nav link). Enter location (e.g. city or ZIP), max price, and income. Click *Search listings*. Results show listings with affordability badges and estimated monthly payment; without `RAPIDAPI_KEY` the backend returns sample listings so the flow is still demoable.
3. **Advisor** — Open http://localhost:9002/advisor for the standalone chat, or use *Ask Advisor* on the calculator page for context-aware advice.

**Suggested screenshot:** Calculator with results visible (monthly cost card, 50/30/20, and at least one risk or AI section). Second: Search results with a few listings and badges.

---

## Implemented features (current)

| Area | What exists |
|------|-------------|
| **Calculator** | PITI + PMI (drops at 80% LTV) + HOA + maintenance; 50/30/20 breakdown; amortization table and balance chart; validation and per-field errors; save/load scenarios (localStorage). |
| **Recommendations** | Recommended and max home price from income (backend); “Recommended price range” card on calculator when income is entered. |
| **Risk & projection** | Backend enhanced analysis: risk indicators, warnings/strengths, 5-year equity projection. Shown after Calculate. |
| **AI** | Explain endpoint (narrative + suggestions) and scenario-aware chat. Groq when `GROQ_API_KEY` set; rule-based fallback otherwise. |
| **Property search** | Form: location, max price, income, down %, rate. Listings with Safe/Good/Stretch/Risky badges and estimated monthly payment. RapidAPI when `RAPIDAPI_KEY` set; sample data otherwise (see [docs/REAL_ESTATE_FEATURE.md](docs/REAL_ESTATE_FEATURE.md)). |
| **Rates** | Backend endpoint for current 30-year rate (FRED). Calculator uses user-entered rate; no auto-fill from FRED in the UI yet. |

---

## Screenshots (placeholders)

Add screenshots below for portfolio and recruiter review. Replace the placeholders with your own assets.

**1. Calculator — main view with results**

Capture: Full calculator form with all sections visible, then scroll so the result cards are in view (e.g. “Monthly housing cost”, “50/30/20 budget”, “Financial risk indicators”, and “Insights” or “5-year projection”). One screenshot or a short GIF (e.g. “Enter values → Calculate → scroll to results”) works well.

```
<!-- Replace with: ![Calculator with results](docs/screenshots/calculator-results.png) -->
```

**2. Search Homes — results with affordability badges**

Capture: Search page after a search has been run, showing at least 2–3 listing cards with prices, addresses, and the colored Safe/Good/Stretch/Risky badges, plus the “Est. monthly payment” line. Include the badge legend if visible.

```
<!-- Replace with: ![Search results with badges](docs/screenshots/search-results.png) -->
```

**3. (Optional) Advisor chat**

Capture: Advisor page or the floating “Ask Advisor” panel open with one exchange (user question + assistant reply) to show the scenario-aware chat.

```
<!-- Replace with: ![Advisor chat](docs/screenshots/advisor-chat.png) -->
```

Store images in `docs/screenshots/` and reference them as above. If you add a GIF, name it clearly (e.g. `calculator-demo.gif`) and keep file size reasonable for the repo.

---

## Future improvements

Planned or under consideration (not implemented):

- **Auth** — OAuth2/JWT for user accounts and persisted scenarios.
- **Calculator + live rate** — Pre-fill rate from `GET /api/v1/real-estate/current-rate` (FRED).
- **Caching** — Redis or CDN for rates and listing responses.
- **Stress/sensitivity UI** — Rate shock (+2% or configurable) and sensitivity to tax/HOA in the UI (backend can be extended).
- **Scenario comparison** — Side-by-side comparison of saved scenarios (localStorage already used for save/load).
- **Tests in CI** — Add front-end and E2E tests to GitHub Actions; optional Lighthouse or performance budget.

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/calc/piti` | Monthly housing cost breakdown |
| POST | `/api/v1/calc/amortization` | Amortization schedule |
| POST | `/api/v1/calc/analyze` | Enhanced analysis (cost breakdown, risk, 5-year projection) |
| POST | `/api/v1/profile/affordability` | 50/30/20 affordability |
| POST | `/api/v1/profile/recommend-home-price` | Recommended/max price from income |
| POST | `/api/v1/ai/explain` | AI narrative and suggestions |
| POST | `/api/v1/ai/chat` | Scenario-aware advisor chat |
| GET | `/api/v1/real-estate/current-rate` | Current 30-year rate (FRED) |
| POST | `/api/v1/real-estate/search` | Listings (default profile) |
| POST | `/api/v1/real-estate/search-with-profile` | Listings (custom income, rate, etc.) |
| GET | `/health` | Health check |

Full request/response shapes: http://localhost:9001/docs

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, Pydantic v2, Python 3.11+ |
| Database | PostgreSQL (Docker) or SQLite (local, in-memory) |
| AI | Groq (Llama); rule-based fallback when key unset |
| External | FRED (rates), RapidAPI (listings); both optional |
| Infra | Docker Compose, Alembic; deploy targets in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

---

## Tests

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend unit (Vitest)
cd frontend && npm test

# Frontend E2E (Playwright)
cd frontend && npx playwright test
```

---

## Security and deployment

- **Security:** Rate limiting (e.g. slowapi), parameterized queries, env-based secrets, no insecure defaults. See [SECURITY.md](SECURITY.md).
- **Deployment:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Railway (backend + Postgres) and Vercel (frontend). Env vars: `infrastructure/.env.example`; required: `DATABASE_URL` (and `POSTGRES_PASSWORD` for Docker).

---

## Repo structure

```
HomePilot/
├── frontend/          # Next.js app
│   └── src/
│       ├── app/       # Routes: /, /search, /advisor
│       ├── components/ # ScenarioBuilder, RealEstateSearch, AdvisorChat, ui/
│       ├── domain/    # Pure TS: mortgage, budget, validate
│       ├── hooks/     # useToasts, useHomeRecommendation
│       └── lib/       # api.ts, scenarioForm, coerce, validate
├── backend/           # FastAPI app
│   └── app/
│       ├── api/       # calc, profile, ai, real_estate
│       ├── calculation_engine/
│       ├── profile_modeling/
│       ├── ai_services/
│       ├── real_estate_services/
│       ├── db/
│       └── schemas/
├── infrastructure/    # Docker, .env template
└── docs/              # ARCHITECTURE, DESIGN, feature guides
```

---

*Live demo URL: add after deploying (e.g. Vercel + Railway). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).*
