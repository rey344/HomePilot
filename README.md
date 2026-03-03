# HomePilot – AI-Assisted Homebuying & Financial Planning

HomePilot is a full-stack, AI-assisted homebuying and financial planning platform. It helps users understand the **true cost of homeownership** and make decisions aligned with the **50/30/20 budgeting framework**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Inter font |
| **Backend** | FastAPI (Python), modular domain-driven design |
| **Database** | PostgreSQL (Docker) or SQLite (local dev) |
| **APIs** | REST with typed Pydantic schemas, OpenAPI/Swagger |
| **Infrastructure** | Docker Compose (optional); runs without Docker |

## Core Features

- **True Homeownership Cost** – PITI + PMI + HOA + maintenance
- **50/30/20 Affordability** – Needs (50%), Wants (30%), Savings (20%); housing + other needs vs budget
- **Mortgage Amortization** – Schedules with PMI (drops at 80% LTV), pagination, balance chart
- **AI Summary** – Narrative explanations and suggestions via `/api/ai/explain`
- **Validation** – Strict input validation (down payment < home value, positive rates/income/term); no coercion; clear error messages
- **ScenarioBuilder** – Raw string inputs, single compute pipeline, housing % color feedback (≤40% green, 40–50% amber, >50% red)

## Project Structure

```
HomePilot/
├── frontend/           # Next.js app
│   ├── src/
│   │   ├── app/        # Pages, layout, globals.css
│   │   ├── components/ # ScenarioBuilder, ui (Card, Button, Input)
│   │   ├── domain/     # Pure mortgage/budget calculations (single source of truth)
│   │   ├── lib/        # API client, validate
│   │   └── e2e/        # Playwright tests
│   └── package.json
├── backend/            # FastAPI app
│   ├── app/
│   │   ├── api/        # /api/calc, /api/profile, /api/ai
│   │   ├── calculation_engine/
│   │   ├── profile_modeling/
│   │   ├── ai_services/
│   │   ├── db/
│   │   └── schemas/
│   └── tests/
├── infrastructure/
│   └── docker-compose.yml
└── docs/
    ├── ARCHITECTURE.md
    └── DESIGN.md
```

## Running the Project

### Option 1: Run without Docker (recommended)

No Docker required. Backend uses SQLite in memory.

**Terminal 1 – backend**

```bash
cd backend
pip install -r requirements.txt   # first time only
DATABASE_URL=sqlite:///:memory: uvicorn app.main:app --reload --port 9001
```

**Terminal 2 – frontend**

```bash
cd frontend
npm install   # first time only
npm run dev
```

Open **[http://localhost:9002](http://localhost:9002)** (app) and [http://localhost:9001/docs](http://localhost:9001/docs) (API docs).

### Option 2: Run with Docker Compose

From the repo root:

```bash
docker compose -f infrastructure/docker-compose.yml up --build -d
```

Then open [http://localhost:9002](http://localhost:9002) and [http://localhost:9001/docs](http://localhost:9001/docs).

**If Docker shows "Internal Server Error" or "API route and version" errors:** that's a Docker Desktop/daemon issue. Restart or update Docker Desktop, or use Option 1.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calc/piti` | Monthly housing cost (PITI + PMI + HOA + maintenance) |
| POST | `/api/calc/amortization` | Amortization schedule (optional `max_months`) |
| POST | `/api/profile/affordability` | 50/30/20 affordability check |
| POST | `/api/ai/explain` | AI narrative and suggestions |
| GET | `/health` | Health check |

## Tests

**Backend**

```bash
cd backend
pytest tests/ -v
```

**Frontend (Vitest)**

```bash
cd frontend
npm run test
```

**E2E (Playwright)**

```bash
cd frontend
npx playwright test
```

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** – System overview, domain modules, API design, data flow
- **[docs/DESIGN.md](docs/DESIGN.md)** – Design system, colors, typography, components
