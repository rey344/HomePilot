# Deployment & demo-readiness audit

One-time audit of local run, deployment, and recruiter evaluation experience. Covers env, startup instructions, scripts, frontend/backend integration, deployment docs, and graceful behavior when optional APIs are unset.

---

## What would have blocked a recruiter (before fixes)

1. **Wrong port in frontend env example** — `frontend/.env.local.example` had `NEXT_PUBLIC_API_URL=http://localhost:8000` while the README and backend run on **9001**. Copying the example would have made the frontend call the wrong port and all API calls would fail (e.g. “Failed to fetch”, empty insights, no search).
2. **Unclear that no .env is needed for quick run** — README didn’t explicitly say “no .env required” for Option A, so recruiters might have looked for or created .env files and gotten stuck.
3. **Optional APIs not summarized in one place** — GROQ/FRED/RapidAPI behavior when unset was in separate docs; no single table in the README showing “app works without keys.”
4. **No health check URL in README** — Recruiters couldn’t quickly verify the backend without opening /docs.
5. **QUICK_DEPLOY.md outdated button name** — Said “Calculate Affordability” instead of “Calculate”.

---

## What was fixed

| Item | Fix |
|------|-----|
| **frontend/.env.local.example** | Set `NEXT_PUBLIC_API_URL=http://localhost:9001` and added a short comment that local dev can omit the file. |
| **README — How to run it locally** | Option A now states that no .env files are required and that the frontend defaults to 9001. Added health check URL (http://localhost:9001/health). Option B clarifies that the setup script generates `.env` and when to copy manually. |
| **README — Optional APIs** | Replaced a single line with a table: variable, purpose, and “when unset” behavior. Linked to docs/ENV.md. |
| **README — Troubleshooting** | Added a short subsection: frontend can’t reach backend (check port, health, NEXT_PUBLIC_API_URL); backend won’t start (DATABASE_URL required). |
| **docs/ENV.md** | New single reference for all env vars: local (backend + frontend), Docker (infrastructure/.env), production (Vercel + Railway/Render), and “graceful behavior when keys are unset.” |
| **docs/QUICK_DEPLOY.md** | Button label “Calculate Affordability” → “Calculate.” |
| **README — Screenshot placeholder** | “AI insights” → “Insights” to match UI. |

No code or infrastructure changes; only docs and the frontend env example.

---

## What still requires manual setup from you

**For local run:** Nothing. Two terminals with the README commands are enough; no .env or API keys needed.

**For Docker:** Either run `./infrastructure/setup-local-env.sh` (generates `infrastructure/.env` with a random DB password) or manually copy `infrastructure/.env.example` to `infrastructure/.env` and set `POSTGRES_PASSWORD` and `DATABASE_URL`. The README and ENV.md describe this.

**For production (Vercel + Railway):**

1. Create accounts and connect the repo (Vercel, Railway).
2. Set backend env vars on Railway: `DATABASE_URL`, `CORS_ORIGINS`, and optionally `GROQ_API_KEY`, etc.
3. Set `NEXT_PUBLIC_API_URL` on Vercel to your backend URL.
4. After first deploy, update `CORS_ORIGINS` with your real Vercel URL (and redeploy backend if needed).

Deployment steps are in [DEPLOYMENT.md](DEPLOYMENT.md) and [QUICK_DEPLOY.md](QUICK_DEPLOY.md). There is no automation (e.g. deploy script); you follow the docs.

**Optional:** Add your live app URL and API docs URL to the README “Live demo URL” line so recruiters see them at the top.

---

## Checklist for recruiter evaluation

- [ ] **Run locally (Option A):** Two terminals, no .env; app at 9002, API at 9001, health at 9001/health.
- [ ] **Calculator:** Enter values → Calculate → see results, recommendations, risk, insights (or loading then rule-based text if no GROQ key).
- [ ] **Search:** Enter location + budget → Search listings → see results (sample data if no RAPIDAPI key).
- [ ] **Advisor:** From calculator, “Ask Advisor” or open /advisor; with context, send a message and get a response (rule-based if no GROQ key).
- [ ] **Deploy (optional):** Follow QUICK_DEPLOY or DEPLOYMENT; set env vars; test live app and CORS.

---

*Audit completed; only documentation and frontend .env.example were changed.*
