# HomePilot – Homebuying & Financial Planning

HomePilot is a full-stack homebuying and financial planning platform. It helps users understand the **true cost of homeownership** and make decisions aligned with the **50/30/20 budgeting framework**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Inter font |
| **Backend** | FastAPI (Python), modular domain-driven design |
| **Database** | PostgreSQL (Docker) or SQLite (local dev) |
| **APIs** | REST with typed Pydantic schemas, OpenAPI/Swagger, API versioning |
| **Infrastructure** | Docker Compose (optional); runs without Docker |
| **Security** | Rate limiting (100 req/min), input sanitization, health checks |

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

### Option 1: Run with Docker Compose (recommended)

From the repo root:

```bash
# Copy and configure environment variables
cp infrastructure/.env.example infrastructure/.env
# Edit .env with your settings (change passwords for production!)

# Start all services
docker compose -f infrastructure/docker-compose.yml up --build -d
```

Then open [http://localhost:9002](http://localhost:9002) (app) and [http://localhost:9001/docs](http://localhost:9001/docs) (API docs).

**Features:**
- ✅ Automatic database migrations on startup
- ✅ Health checks for all services
- ✅ PostgreSQL with persistent data volume
- ✅ Production-ready configuration

### Option 2: Run without Docker

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

## API Endpoints

**Latest (v1):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/calc/piti` | Monthly housing cost (PITI + PMI + HOA + maintenance) |
| POST | `/api/v1/calc/amortization` | Amortization schedule (optional `max_months`) |
| POST | `/api/v1/profile/affordability` | 50/30/20 affordability check |
| POST | `/api/v1/ai/explain` | AI narrative and suggestions |
| GET | `/health` | Health check with database connectivity |

**Legacy (v0) endpoints** at `/api/calc/*`, `/api/profile/*`, `/api/ai/*` are maintained for backward compatibility.

## Security Features

- 🔒 **Rate Limiting**: 100 requests/minute per IP
- 🛡️ **Input Sanitization**: XSS protection on all user inputs
- 🔐 **Environment Variables**: Secure credential management
- 📊 **Logging**: Comprehensive request/response logging
- 💉 **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- ❤️ **Health Checks**: Database connectivity monitoring
- 🚫 **Pagination Limits**: Max 100 scenarios per query

## Production Deployment

### Environment Variables

Required environment variables (set in `.env` or container environment):

```bash
# Database (CHANGE PASSWORD!)
POSTGRES_USER=homepilot
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=homepilot
DATABASE_URL=postgresql://user:pass@host:5432/db

# CORS (comma-separated origins)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Docker Compose Commands

```bash
# Start services
docker compose -f infrastructure/docker-compose.yml up -d

# View logs
docker compose -f infrastructure/docker-compose.yml logs -f

# Stop services
docker compose -f infrastructure/docker-compose.yml down

# Rebuild and restart
docker compose -f infrastructure/docker-compose.yml up --build -d

# Remove all data
docker compose -f infrastructure/docker-compose.yml down -v
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

## Known Limitations

- **Authentication**: Not implemented. Add OAuth2/JWT before production use.
- **AI Service**: Currently returns mock responses. Integrate actual LLM provider.
- **Caching**: No Redis/CDN caching implemented yet.
- **File Storage**: No document upload/storage capabilities.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`pytest` in backend, `npm test` in frontend)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

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
