# HomePilot – Final QA & Recruiter Audit

One-time audit from three perspectives: technical recruiter (quick scan), junior hiring manager (codebase review), and interviewer (discussion readiness). Covers credibility, clarity, completeness, cohesion, professionalism, technical strength, UI consistency, documentation, and demo readiness.

---

## A. What now feels strong

**Credibility**
- README and docs clearly separate “what exists” vs “future work.” No overclaiming (e.g. sample data when `RAPIDAPI_KEY` is unset is documented).
- API table and run instructions match the code. Demo walkthrough is accurate (button label “Calculate” and “Recommended price range” aligned in this audit).
- Backend has tests; frontend has unit (Vitest) and E2E (Playwright) mentioned; security (rate limiting, env, SECURITY.md) is documented.

**Clarity**
- Three routes (/, /search, /advisor) with consistent nav (Calculator, Advisor, Search Homes). One clear entry point (Calculator) and cross-links to Search and Advisor.
- Copy is concise and professional: “Calculate,” “Save scenario,” “Search by budget,” “Insights,” “Ask Advisor.” Error and empty states are consistent (“Fix the errors below,” “No listings found” with one line of guidance).

**Completeness**
- Calculator: full flow (inputs → validate → calculate → results, recommendations, risk, projection, amortization, insights, Advisor CTA). Search: form → validation → results/empty state and badge legend. Advisor: with and without scenario context.
- Loading and error handling exist on calculator (form errors, API error, loading recommendations/insights), search (loading, validation, API error, empty), and Advisor (loading, error, no-context message).

**Cohesion**
- One design system (globals.css tokens); shared Card, Button, Input, Toast, Tooltip; dark theme and semantic colors (success/warning/danger/wants) used in badges and risk cards.
- Affordability logic is shared: calculator domain + backend profile/real-estate use the same 50/30/20 idea; search badges match calculator language.

**Professionalism**
- No emoji or exclamation-heavy copy. Sentence case for secondary actions; primary CTAs are clear. Metadata and page intros are short and factual.

**Technical strength**
- Frontend domain layer (pure TS mortgage/budget/validate) with tests; backend calculation_engine and profile_modeling; API versioned under /api/v1; OpenAPI at /docs.
- Refactors (hooks, scenarioForm, coerce, extracted cards) keep ScenarioBuilder readable; RealEstateSearch uses validation and design tokens.

**UI consistency**
- Forms use the same Input + error pattern; cards use Card/CardHeader/CardTitle; buttons use design tokens. Search and calculator both use the same semantic badge colors.

**Documentation quality**
- README: what it does, tech highlights, architecture blurb, how to run, demo walkthrough, implemented features table, screenshot placeholders, future work, API reference.
- ARCHITECTURE.md: system overview, layout, domain layer, backend modules, data flow, interviewer note. REAL_ESTATE_FEATURE.md and FRED_INTEGRATION.md explain optional keys and sample data.

**Demo readiness**
- Run with two terminals (backend + frontend) or Docker. No API keys required for calculator + search (sample listings). Demo steps and suggested screenshots are in the README.

---

## B. What still feels weak

**Backend scenario API unused in UI**
- Backend exposes `/api/v1/profile/scenarios` (CRUD). Frontend only uses localStorage for “Saved scenarios.” So persistence is local only; the backend feature is there for a future auth/persistence story. Not broken, but a recruiter might ask “why two ways to save?”—answer: “Backend ready for when we add auth; for now we kept the demo simple with localStorage.”

**Optional: custom 404**
- No `app/not-found.tsx`. Next.js serves the default 404. Adding a simple branded not-found would polish edge cases (e.g. wrong URL during demo).

**Advisor without context**
- On /advisor with no calculator run, the empty state explains to run the calculator first. That’s clear, but the page doesn’t offer a prominent “Go to Calculator” link in that state (user can use nav). Low priority; could add a short link in the empty message.

**API client: a few unused exports**
- In `frontend/src/lib/api.ts`, `fetchPiti`, `fetchAffordability`, and `searchRealEstate` (no profile) are not used by the app; the UI uses `fetchEnhancedLoanAnalysis` and `searchRealEstateWithProfile`. Backend still has the endpoints. Either keep for API completeness or remove to avoid “dead code” questions. Recommendation: leave as-is and note in a code comment that they’re for direct API use, or remove if you want zero unused surface.

---

## C. Remaining red flags

**None critical.** The following are minor or easily explained:

- **No auth** — Stated everywhere (README, future work). For a portfolio piece this is acceptable; “auth would use the existing profile/scenarios API” is a good interview answer.
- **Unused frontend API helpers** — Minor. Can be removed or commented as “for API consumers” if you want to avoid the question.
- **Advisor “Something went wrong”** — Generic error message on chat failure. Could be improved later with retry or a friendlier line; not a red flag for a junior-level project.

---

## D. Top 5 final improvements (if pushing further)

1. **Wire a “Go to Calculator” link in Advisor empty state**  
   When `!hasContext`, add a short link: “Run the calculator first” → links to /. Small UX improvement for /advisor-only visitors.

2. **Add `app/not-found.tsx`**  
   Simple page with HomePilot branding and a link back to /. Shows attention to edge cases.

3. **Remove or document unused API client functions**  
   Either delete `fetchPiti`, `fetchAffordability`, and `searchRealEstate` from the frontend (if nothing uses them) or add a one-line comment: “Legacy/direct API use; app uses fetchEnhancedLoanAnalysis and searchRealEstateWithProfile.”

4. **Add 1–2 real screenshots**  
   README has placeholders. One screenshot of the calculator with results and one of search results with badges would make the repo immediately more convincing.

5. **Optional: ARCHITECTURE layout**  
   In ARCHITECTURE.md §2, add `hooks/` (useToasts, useHomeRecommendation) and `lib/` (scenarioForm, coerce, validate) to the frontend tree so the layout matches the current structure.

---

## E. Does this project help or hurt for junior software roles?

**It helps.**

- **Scope:** One product, three clear features (calculator, search, advisor), with shared affordability logic and a single design system. Shows you can ship a coherent app, not just isolated features.
- **Stack:** Modern (Next.js 16, React 19, FastAPI, TypeScript domain layer, Pydantic). Good for “walk me through your tech choices.”
- **Code quality:** Domain separated from UI; validation and error handling in place; refactored components and hooks; consistent naming and copy. Suitable for “how did you structure this?” and “how would you add X?”
- **Honesty:** Docs and UI don’t oversell; optional APIs and sample data are explained. That supports trust in technical discussions.
- **Demo:** Runnable in minutes; demo script is in the README. Interviewers can try it and you can drive the flow.

**It would hurt only if** you presented it as production-ready with auth and scale (you don’t) or if the app were broken or inconsistent (current audit doesn’t show that). As a portfolio piece with clear “what’s built” vs “what’s next,” it is an asset for junior roles.

---

## Lingering issues (inventory)

**Dead / unused code**
- **Frontend:** `fetchPiti`, `fetchAffordability`, `searchRealEstate` in `lib/api.ts` are not imported anywhere. Backend endpoints exist. See D.3.

**Inconsistent naming**
- None significant. “Calculator” / “Advisor” / “Search Homes” in nav; “Your scenario,” “Recommended price range,” “Insights” in UI; “Saved scenarios” in dropdown. All aligned.

**Incomplete routes**
- None. /, /search, /advisor are implemented and linked. No broken internal links found.

**Documentation drift**
- **Fixed in this audit:** README demo step said “Calculate affordability” → updated to “Calculate”; README features table said “Recommended Home Price Range” → “Recommended price range”; useHomeRecommendation comment updated to match.
- **Optional:** ARCHITECTURE §2 frontend tree could list `hooks/` and `lib/` (scenarioForm, coerce) for full accuracy.

**Styling drift**
- Button and AmortizationCard use `hover:bg-white/5` and `bg-white/[0.04]`; DESIGN.md allows hover:bg-white/5. No raw gray-* or standalone white text; primary and semantic tokens are used. No change required.

**Obvious missing states**
- Calculator: validation and API errors shown; loading for recommendations and insights. Search: validation, API error, empty results. Advisor: no context, loading, send error. ErrorBoundary covers runtime errors. No glaring gaps.

**Bolted-on feel**
- Search and Advisor are integrated: same nav, same design tokens, same affordability language, and cross-links from calculator. Search uses the same badge semantics as the rest of the app. Nothing feels like a separate project dropped in.

---

*Audit completed after documentation and microcopy polish. Small doc/copy fixes applied (README demo step, README features table, useHomeRecommendation comment).*
