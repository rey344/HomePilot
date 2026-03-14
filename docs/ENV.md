# Environment variables

Reference for all environment variables used by HomePilot. Use this when running locally (with or without Docker) or deploying.

---

## Local run (no Docker)

**Backend:** Only `DATABASE_URL` is required. Pass it in the shell when starting:

```bash
DATABASE_URL=sqlite:///:memory: uvicorn app.main:app --reload --port 9001
```

**Frontend:** No env file needed. The app defaults to `http://localhost:9001`. To point to a different backend (e.g. port or host), create `frontend/.env.local` from `frontend/.env.local.example` and set `NEXT_PUBLIC_API_URL`.

---

## Docker (infrastructure/.env)

Used by `docker compose -f infrastructure/docker-compose.yml`. Copy from `infrastructure/.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes (Docker) | PostgreSQL user (e.g. `homepilot`) |
| `POSTGRES_PASSWORD` | Yes (Docker) | Strong password; use `openssl rand -base64 32` or the setup script |
| `POSTGRES_DB` | Yes (Docker) | Database name (e.g. `homepilot`) |
| `DATABASE_URL` | Yes | Full URL, e.g. `postgresql://homepilot:YOUR_PASSWORD@postgres:5432/homepilot` |
| `CORS_ORIGINS` | No | Comma-separated origins; default `http://localhost:9002,http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | No | Backend URL for frontend build; default `http://localhost:9001` |
| `RAPIDAPI_KEY` | No | Property listings; empty = sample data |
| `FRED_API_KEY` | No | Live mortgage rate; empty = default rate |
| `GROQ_API_KEY` | No | AI; empty = rule-based responses |
| `AI_PROVIDER` | No | `groq` or `mock` |
| `AI_MODEL` | No | Groq model name |
| `AI_TEMPERATURE` | No | 0.0–1.0 |
| `AI_MAX_TOKENS` | No | Max response tokens |

Run `./infrastructure/setup-local-env.sh` to generate `.env` with a random password for Docker.

---

## Production (Vercel + Railway/Render)

**Frontend (Vercel):**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Full backend URL (e.g. `https://your-backend.railway.app`) |

**Backend (Railway/Render):**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Railway: `${{Postgres.DATABASE_URL}}`) |
| `CORS_ORIGINS` | Yes | Your Vercel app URL(s), comma-separated |
| `PORT` | Set by platform | Railway/Render set this; backend listens on `$PORT` |
| `GROQ_API_KEY` | No | Optional; enables real AI |
| `FRED_API_KEY` | No | Optional; live rate |
| `RAPIDAPI_KEY` | No | Optional; live listings |

See [DEPLOYMENT.md](DEPLOYMENT.md) and [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for step-by-step deployment.

---

## Graceful behavior when keys are unset

- **No `GROQ_API_KEY`:** AI explain and Advisor use rule-based responses. No errors.
- **No `FRED_API_KEY`:** `/api/v1/real-estate/current-rate` returns a default rate. No errors.
- **No `RAPIDAPI_KEY`:** Search returns sample listings for the requested location/max price. No errors.

The app is fully demoable without any API keys.
