# HomePilot Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4. Runs on **port 9002**; expects backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:9001`).

For full setup and demo flow, see the [root README](../README.md).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:9002.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 9002) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm test` | Vitest unit tests |
| `npx playwright test` | E2E tests (Playwright) |

## Layout

| Path | Purpose |
|------|---------|
| `src/app/` | App Router: `/`, `/search`, `/advisor` |
| `src/components/` | ScenarioBuilder, RealEstateSearch, AdvisorChat, ui/ (Card, Button, Input, Toast, Tooltip) |
| `src/domain/` | Pure TS: mortgage, budget, round, validate (calculator logic) |
| `src/hooks/` | useToasts, useHomeRecommendation |
| `src/lib/` | api.ts, scenarioForm, coerce, validate (search + parseApiError) |
