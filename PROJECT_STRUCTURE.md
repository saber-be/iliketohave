# Project Structure & Development Guide

## Top-Level Layout

- **backend/**
  FastAPI application, domain logic and persistence.

- **frontend/**
  Next.js 14 (React/TypeScript) application.

- **docker/**
  Dockerfiles and `docker-compose.yml` for local multi-service dev.

- **shared/**
  Shared code/resources mounted into containers (e.g. types, utilities).

- **.gitignore**
  Git ignore rules.

---

## Backend (FastAPI)

### Structure

- **backend/application/**
  Application layer (use-cases, services, request/response models).

- **backend/domain/**
  Domain models and business rules (e.g. users, wishlists).

- **backend/infrastructure/**
  Infrastructure concerns:
  - **db/**: DB config, session/engine setup.
  - **repositories/**: DB access implementations (SQLAlchemy, etc.).
  - **services/**: Integrations and cross-cutting infra services.

- **backend/presentation/**
  API presentation layer (FastAPI app, routers, request handling).

- **backend/requirements.txt**
  Python dependencies (FastAPI, Uvicorn, SQLAlchemy, Alembic, etc.).

### Local Development (without Docker)

High-level flow (see `DEPLOYMENT.md` for full step-by-step commands):

- Create and activate a virtualenv, then install deps from `requirements.txt`.
- Configure env vars, including for example:
  - `DATABASE_URL="postgresql+asyncpg://USER:PASSWORD@localhost:5432/DB_NAME"`
  - `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRES_MIN`
- Run the API server using the same entrypoint as the Dockerfile:
  ```bash
  uvicorn backend.presentation.app:app --host 0.0.0.0 --port 8000 --reload
  ```
- Access the API and docs (if enabled):
  - Base URL: `http://localhost:8000`
  - Docs: `http://localhost:8000/docs` (Swagger UI)

---

## Frontend (Next.js)

### Structure

- **frontend/app/**
  App Router pages:
  - **dashboard/**, **profile/**, **wishlists/**, **public/**, etc.

- **frontend/components/**
  Reusable UI components.

- **frontend/lib/**
  Client helpers (API clients, utilities, etc.).

- **frontend/public/**
  Static assets.

- **frontend/styles/**
  Global/Tailwind styles.

- **frontend/next.config.mjs**
  Next.js configuration.

- **frontend/tailwind.config.mjs**
  TailwindCSS configuration.

- **frontend/tsconfig.json**
  TypeScript configuration.

- **frontend/package.json**
  NPM scripts and dependencies.

### Local Development (without Docker)

Summary (see `DEPLOYMENT.md` for full details):

- Install Node.js dependencies with `npm install`.
- Create `.env.local` in `frontend/` and set:
  ```bash
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
  ```
  ensuring it matches the running backend URL.
- Start the dev server with `npm run dev` and access the app at `http://localhost:3000`.

### Frontend Scripts (from `package.json`)

- **`npm run dev`** – start Next.js dev server.
- **`npm run build`** – production build.
- **`npm run start`** – start Next.js in production mode (after `build`).
- **`npm run lint`** – run ESLint.
- **`npm run test`** – run Jest tests.

---

## Docker-Based Development

All Docker-related files are under `docker/`.

- **docker/docker-compose.yml**
  Defines three services:
  - **db**: PostgreSQL 16
  - **backend**: FastAPI app
  - **frontend**: Next.js app

- **docker/backend.Dockerfile**
  Backend container image definition.

- **docker/frontend.Dockerfile**
  Frontend container image definition.

- **docker/.env** / **docker/.env.example**
  Environment variables consumed by `docker-compose.yml`:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `JWT_SECRET`
  - (others as needed)

### How `docker-compose.yml` Works

- **db service**
  - Image: `postgres:16-alpine`
  - Exposes `5432:5432`
  - Uses `db_data` volume for persistence.

- **backend service**
  - Built from repo root with `docker/backend.Dockerfile`.
  - Environment:
    - `DATABASE_URL` uses `db` hostname, example:
      `postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
    - `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRES_MIN`.
  - Depends on `db` healthcheck.
  - Exposes `8000:8000`.
  - Mounts `../backend` into `/app/backend` for live code reload (depending on app config).

- **frontend service**
  - Built with `docker/frontend.Dockerfile`.
  - Environment:
    - `NEXT_PUBLIC_API_BASE_URL=http://backend:8000`
  - Depends on `backend`.
  - Exposes `3000:3000`.
  - Working directory: `/app/frontend`.
  - Command: `npm run dev`.
  - Mounts:
    - `../frontend` to `/app/frontend`
    - `../shared` to `/app/shared`

### Running with Docker

1. **Configure environment**
   Copy the example env file and adjust values:
   ```bash
   cd docker
   cp .env.example .env
   # edit .env (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_SECRET, ...)
   ```

2. **Start all services**
   ```bash
   docker compose up --build
   ```

3. **Access services**
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:3000`
   - PostgreSQL: `localhost:5432`

4. **Stop services**
   ```bash
   docker compose down
   ```

---

## Shared Folder

- **shared/**
  Mounted into the frontend container at `/app/shared`.

Use this folder for code, types, or configuration shared between backend and frontend (for example, TypeScript types that mirror backend schemas, validation rules, etc.).

---

## Typical Dev Workflow

1. **Backend-only work**
   - Run FastAPI locally (with or without Docker DB).
   - Update `backend/` code.
   - Hit `http://localhost:8000` or OpenAPI docs.

2. **Frontend-only work**
   - Run Next.js dev server from `frontend/`.
   - Ensure `NEXT_PUBLIC_API_BASE_URL` points to your running backend.

3. **Full-stack via Docker**
   - Use `docker/docker-compose.yml` to start db + backend + frontend.
   - Develop against `http://localhost:3000` with backend at `http://localhost:8000`.

This document should give you a quick overview of where things live and how to run both backend and frontend in this project.
