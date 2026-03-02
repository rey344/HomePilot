# HomePilot – AI-Assisted Homebuying & Financial Planning Platform (2026)

HomePilot is a full-stack, AI-assisted homebuying and financial planning platform designed to help users understand the **true cost of homeownership** and make decisions aligned with the **50/30/20 budgeting framework**.

The platform combines a modern Next.js/TypeScript frontend, a modular FastAPI backend, and PostgreSQL persistence, all packaged as a production-ready, Dockerized monorepo.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: FastAPI (Python), modular domain-driven design
- **Database**: PostgreSQL
- **APIs**: REST APIs with typed request/response schemas
- **Infrastructure**: Docker (services + local dev), Docker Compose
- **AI Integration**: Pluggable AI services layer for guidance, scenario exploration, and narrative explanations

## Core Capabilities

- **True Homeownership Cost Engine**
  - Calculates PITI (Principal, Interest, Taxes, Insurance)
  - Incorporates **HOA**, **PMI**, and **ongoing maintenance** assumptions
  - Handles variable inputs such as down payment, term length, interest rate, property tax rate, and insurance assumptions

- **Budgeting & Affordability Analysis**
  - Compares homeownership costs against user income and expenses using the **50/30/20 framework**
  - Flags scenarios where housing costs crowd out needs/wants/savings allocations
  - Supports multiple scenarios (e.g., different purchase prices, interest rates, or down payment levels)

- **Mortgage Amortization Engine**
  - Configurable loan terms (e.g., 15/20/30-year fixed, adjustable variants)
  - **Credit-score-based PMI estimation** via rule-based tables and extensible logic
  - Amortization schedules with per-period breakdown (principal/interest/remaining balance)
  - Hooks for additional modeling (extra payments, lump-sum prepayments, rate changes)

- **AI-Assisted Planning**
  - AI-guided narratives explaining affordability, trade-offs, and risk factors
  - Suggestions for adjusting inputs (e.g., down payment, term, price range) to fit 50/30/20
  - Extensible integration point for LLMs or external AI services

## Backend Architecture (FastAPI)

The backend is structured with **clear domain separation** and type-safe boundaries:

- **`calculation_engine`**
  - Core financial calculations: PITI, PMI, HOA, maintenance estimates, amortization schedules
  - Deterministic, unit-test-focused module with minimal external dependencies

- **`profile_modeling`**
  - User income, expense, and savings profiles
  - Affordability classification under 50/30/20
  - Scenario management (e.g., multiple homes, multiple loan configurations)

- **`ai_services`**
  - Abstraction layer over AI providers (e.g., OpenAI, local models)
  - Prompts and response shaping for explanations, coaching, and recommendations
  - Isolation of model-specific concerns from business logic

- **API Layer**
  - FastAPI routers grouped by domain (e.g., `/api/calc`, `/api/profile`, `/api/ai`)
  - Pydantic models for **type-safe request/response schemas**
  - OpenAPI/Swagger for **self-documenting, discoverable REST APIs**

## Frontend Architecture (Next.js + TypeScript)

- **Pages & Routing**
  - High-level routes for onboarding, scenario setup, results dashboards, and AI-guided insights

- **Feature Modules**
  - **Scenario Builder**: capture user profile, target home parameters, and constraints
  - **Affordability Dashboard**: visualize PITI+HOA+PMI+maintenance vs 50/30/20 allocations
  - **Amortization Explorer**: interactive charts and tables for payment schedules

- **Type Safety & API Integration**
  - Shared TypeScript types aligned with backend schemas (e.g., via OpenAPI-generated types or shared contracts)
  - API client modules encapsulating calls to FastAPI endpoints

## Monorepo & Infrastructure

HomePilot is **architected as a production-ready monorepo**:

- **Service Layout**
  - `frontend/` – Next.js + TypeScript application
  - `backend/` – FastAPI application, domain modules, and tests
  - `infrastructure/` – Docker, Docker Compose, and environment configuration

- **Dockerization**
  - Separate Docker images for frontend, backend, and database
  - Multi-stage builds for lean production images
  - Local development using Docker Compose (frontend, backend, Postgres, and optional AI proxies)

- **API Documentation**
  - OpenAPI spec auto-generated from FastAPI routes
  - Swagger UI available in development for interactive exploration of endpoints

