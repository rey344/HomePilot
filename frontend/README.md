HomePilot frontend: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4. Runs on **port 9002** so it can share the machine with the backend (9001).

## Getting started

From the repo root, see [README.md](../README.md) for full quick start. To run only the frontend:

```bash
npm install
npm run dev
```

Open **http://localhost:9002** in your browser. The app expects the backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:9001`).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server on port 9002 |
| `npm run build` | Production build |
| `npm run start` | Start production server (port 9002) |
| `npm test` | Vitest unit tests |
| `npx playwright test` | E2E tests (Playwright) |

## Project layout

- `src/app/` — App Router pages and layout
- `src/components/` — ScenarioBuilder, search (SearchHomesView, SearchFilters, ListingCard), AdvisorChat, UI primitives
- `src/domain/` — Pure TS: mortgage, budget, listingAffordability, round, validate
- `src/lib/` — API client, searchUtils, searchMock
