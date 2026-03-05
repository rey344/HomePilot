# HomePilot – Homebuying & Financial Planning

HomePilot is a full-stack homebuying and financial planning platform. It helps users understand the **true cost of homeownership** and make decisions aligned with the **50/30/20 budgeting framework**.

## 🚀 Live Demo

> **Coming Soon**: Deployed on Vercel + Railway

<!-- Uncomment after deployment and replace with your actual URLs:
- **App**: [https://your-app-name.vercel.app](https://your-app-name.vercel.app)
- **API Docs**: [https://your-backend.up.railway.app/docs](https://your-backend.up.railway.app/docs)
-->

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Inter font |
| **Backend** | FastAPI (Python), modular domain-driven design |
| **Database** | PostgreSQL (Docker) or SQLite (local dev) |
| **APIs** | REST with typed Pydantic schemas, OpenAPI/Swagger, API versioning |
| **Infrastructure** | Docker Compose (optional); runs without Docker |
| **Security** | Rate limiting (100 req/min), secret scanning (Gitleaks), pre-commit hooks, fail-fast config validation |

## Core Features

- **True Homeownership Cost** – PITI + PMI + HOA + maintenance
- **50/30/20 Affordability** – Needs (50%), Wants (30%), Savings (20%); housing + other needs vs budget
- **Mortgage Amortization** – Schedules with PMI (drops at 80% LTV), pagination, balance chart
- **AI Financial Advisor** – Real LLM integration (OpenAI, Groq, Anthropic) for personalized advice via `/api/ai/explain`
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
# Quick setup with helper script (generates secure password automatically)
./infrastructure/setup-local-env.sh

# Start all services
docker compose -f infrastructure/docker-compose.yml up --build -d
```

**OR manually:**

```bash
# Copy and configure environment variables
cp infrastructure/.env.example infrastructure/.env

# ⚠️  SECURITY: Edit .env and set secure passwords
# Generate strong password: openssl rand -base64 32
# Replace CHANGE_ME_REQUIRED with your generated password
nano infrastructure/.env  # or use your preferred editor

# Start all services
docker compose -f infrastructure/docker-compose.yml up --build -d
```

Then open [http://localhost:9002](http://localhost:9002) (app) and [http://localhost:9001/docs](http://localhost:9001/docs) (API docs).

**Features:**
- ✅ Automatic database migrations on startup
- ✅ Health checks for all services
- ✅ PostgreSQL with persistent data volume
- ✅ Production-ready configuration
- 🔒 Secure secret management (no hardcoded passwords)

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
- 🔐 **Secret Management**: Zero hardcoded credentials, fail-fast validation
- 🔍 **Secret Scanning**: Pre-commit hooks (Gitleaks) + GitHub Actions (Gitleaks + TruffleHog)
- 📊 **Logging**: Comprehensive request/response logging
- 💉 **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- ❤️ **Health Checks**: Database connectivity monitoring
- 🚫 **Pagination Limits**: Max 100 scenarios per query
- 🔑 **Environment-based Config**: All secrets from env vars or .env files (never committed)

**See [SECURITY.md](SECURITY.md) for comprehensive security documentation.**

## Production Deployment

**📦 Deploy to production in minutes!**

See the comprehensive [**Deployment Guide**](docs/DEPLOYMENT.md) for step-by-step instructions to deploy:
- **Frontend**: Vercel (recommended)
- **Backend**: Railway or Render
- **Database**: Railway PostgreSQL, Neon, or Supabase

**Quick Start Deployment:**
1. Push code to GitHub
2. Connect Railway to your repo (backend + database)
3. Connect Vercel to your repo (frontend)
4. Set environment variables
5. Done! ✅

### Environment Variables

**⚠️ SECURITY NOTICE:** All secrets are **REQUIRED** (no insecure defaults). The app will refuse to start if `DATABASE_URL` is missing.

Required variables (set in `infrastructure/.env` or container environment):

```bash
# Database credentials - GENERATE STRONG PASSWORDS
# Use: openssl rand -base64 32
POSTGRES_USER=homepilot
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>
POSTGRES_DB=homepilot
DATABASE_URL=postgresql://homepilot:<PASSWORD>@postgres:5432/homepilot

# CORS (comma-separated origins - NO wildcards in production)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Optional: RapidAPI for real estate listings (uses mock data if not set)
RAPIDAPI_KEY=<your_key_or_leave_empty>
```

**Production Deployment:**
- Use your platform's secret manager (Railway Secrets, Vercel Environment Variables)
- Never commit `.env` files (they are gitignored)
- Different credentials for dev/staging/production
- Rotate secrets every 90 days

See [SECURITY.md](SECURITY.md) for detailed secret management guide.

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
- **AI Service**: Requires API key for real AI (Groq/OpenAI/Anthropic). Falls back to rule-based responses. See [AI Integration Guide](docs/AI_INTEGRATION.md).
- **Caching**: No Redis/CDN caching implemented yet.
- **File Storage**: No document upload/storage capabilities.

## Contributing

**Security First:** Install pre-commit hooks before making changes to prevent accidental secret commits.

```bash
# Install pre-commit hooks (one-time setup)
pip install pre-commit
pre-commit install

# The hooks will now run automatically on git commit
# To run manually: pre-commit run --all-files
```

Contribution workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install pre-commit hooks (see above)
4. Make your changes
5. Run tests (`pytest` in backend, `npm test` in frontend)
6. Commit changes (pre-commit hooks will scan for secrets automatically)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

**Pre-commit hooks will:**
- ✅ Scan for hardcoded secrets (Gitleaks)
- ✅ Detect private keys
- ✅ Check YAML syntax
- ✅ Lint Python code (Ruff)
- ✅ Lint TypeScript/JavaScript (ESLint)

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
- **[docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md)** – AI provider setup guide (Groq, OpenAI, Anthropic)
- **[SECURITY.md](SECURITY.md)** – Security best practices and secret management
