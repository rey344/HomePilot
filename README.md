# HomePilot

A full-stack homebuying affordability platform. HomePilot helps prospective buyers understand the true monthly cost of owning a home — PITI, PMI, HOA, and maintenance — and evaluates that cost against their income using the 50/30/20 budgeting framework.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.13), Pydantic v2, SQLAlchemy 2 |
| Database | PostgreSQL (Docker) · SQLite (local dev, no setup required) |
| AI | Groq — Llama 3.3 70B; rule-based fallback when key not set |
| External APIs | Federal Reserve FRED (live mortgage rates) · RapidAPI (property search) |
| Infrastructure | Docker Compose, Alembic migrations, Railway + Vercel deploy targets |
| Security | Rate limiting, Gitleaks pre-commit hooks, GitHub Actions secret scanning |

## Features

- **Mortgage calculator** — principal & interest, property tax, insurance, PMI (drops at 80% LTV), HOA, maintenance
- **50/30/20 affordability analysis** — housing cost as a share of income with per-bucket surplus/deficit breakdown
- **Amortization schedule** — paginated month-by-month table with balance visualization
- **Live mortgage rates** — 30-year fixed rate pulled from the Federal Reserve FRED API
- **AI financial advisor** — Groq LLM generates a personalized narrative and actionable suggestions; graceful fallback to rule-based responses
- **Financial profile modeling** — 5-year equity projection, rate-shock stress test (+2%), max affordable home price from income
- **Property search** — RapidAPI listing integration with mock fallback

## Project Structure

```
HomePilot/
├── frontend/                     # Next.js app (TypeScript)
│   └── src/
│       ├── app/                  # App Router pages and layout
│       ├── components/           # ScenarioBuilder, RealEstateSearch, UI primitives
│       ├── domain/               # Pure TS calculation functions (single source of truth)
│       └── lib/                  # Typed API client, error parsing
├── backend/                      # FastAPI app (Python)
│   └── app/
│       ├── api/                  # Versioned routers: calc, profile, ai, real-estate
│       ├── calculation_engine/   # PITI, PMI, amortization — pure logic
│       ├── profile_modeling/     # Affordability, projection, risk analysis
│       ├── ai_services/          # Groq provider, prompt builder, response parser
│       ├── real_estate_services/ # FRED rates, RapidAPI listings
│       ├── db/                   # SQLAlchemy models, Alembic migrations, CRUD
│       └── schemas/              # Pydantic request/response models
├── infrastructure/               # Docker Compose, .env.example
└── docs/                         # Architecture, design system, API guides
```

## Running Locally

### With Docker (recommended)

```bash
# Generate a secure .env from the template
./infrastructure/setup-local-env.sh

# Start PostgreSQL + backend + frontend
docker compose -f infrastructure/docker-compose.yml up --build -d
```

App: http://localhost:9002 · API docs: http://localhost:9001/docs

### Without Docker

```bash
# Terminal 1 — backend (SQLite in memory, no database setup needed)
cd backend
pip install -r requirements.txt
DATABASE_URL=sqlite:///:memory: uvicorn app.main:app --reload --port 9001

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

App: http://localhost:9002 · API docs: http://localhost:9001/docs

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/calc/piti` | Monthly housing cost breakdown |
| POST | `/api/v1/calc/amortization` | Full amortization schedule |
| POST | `/api/v1/profile/affordability` | 50/30/20 affordability check |
| POST | `/api/v1/ai/explain` | AI narrative and suggestions |
| GET | `/api/v1/real-estate/rates` | Current 30-year fixed rate (FRED) |
| GET | `/health` | Health check with DB connectivity |

Legacy routes at `/api/*` are preserved for backward compatibility.

## Security

- Rate limiting: 100 requests/minute per IP via `slowapi`
- Parameterized queries throughout (SQLAlchemy ORM — no raw SQL)
- Input validation and XSS sanitization on all user inputs
- Secrets managed through environment variables only; app fails fast if required vars are missing
- Pre-commit hooks run Gitleaks on every commit to prevent accidental secret exposure
- GitHub Actions runs Gitleaks + TruffleHog on every push and PR

See [SECURITY.md](SECURITY.md) for the full policy.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step instructions deploying to Railway (backend + PostgreSQL) and Vercel (frontend).

### Environment Variables

Copy `infrastructure/.env.example` to `infrastructure/.env` and set values before running.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL or SQLite connection string |
| `POSTGRES_PASSWORD` | Yes (Docker) | Generate with `openssl rand -base64 32` |
| `CORS_ORIGINS` | Production | Comma-separated allowed origins |
| `GROQ_API_KEY` | No | Enables real AI; falls back to rule-based if unset |
| `FRED_API_KEY` | No | Live mortgage rates; uses cached default if unset |
| `RAPIDAPI_KEY` | No | Property search; uses mock data if unset |

The app will refuse to start if `DATABASE_URL` is missing — no insecure defaults.

### Tests

```bash
# Backend unit + integration tests
cd backend && pytest tests/ -v

# Frontend unit tests (Vitest)
cd frontend && npm test

# Frontend E2E tests (Playwright)
cd frontend && npx playwright test
```

## Known Limitations

- No authentication. Add OAuth2/JWT before exposing user data.
- No caching layer (Redis/CDN).
- Groq API key required for real AI responses (free tier available at console.groq.com).
