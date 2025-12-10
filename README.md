# ILikeToHave

A full‑stack web application for creating and managing wishlists. Users can sign up, manage personal wishlists, browse public wishlists, and share their wishlists (each containing multiple items) with others.

This repository contains:
- A **FastAPI** backend for authentication, wishlist management, and data access.
- A **Next.js** frontend for the user interface.
- A **PostgreSQL** database and **Docker** setup for consistent local and live environments.

---

## Project Goals

- **Wishlist management**  
  Let users create, update, and share wishlists (public or private).

- **Simple account system**  
  Handle user registration, login, and secure access to private data.

- **Clean separation of concerns**  
  Use a layered architecture (domain, application, infrastructure, presentation) to keep business logic decoupled from frameworks.

- **Straightforward local and production deployment**  
  Provide a Docker‑based setup that runs the entire stack with minimal configuration.

---

## Tech Stack

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Database:** PostgreSQL
- **ORM / DB layer:** SQLAlchemy (async) + asyncpg
- **Migrations:** Alembic
- **Auth & security:** JWT (PyJWT), bcrypt
- **Packaging:** `requirements.txt`, Docker image via `docker/backend.Dockerfile`

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript + React 18
- **Styling:** Tailwind CSS
- **HTTP client:** Axios
- **Tooling:** ESLint, Jest, Testing Library
- **Dev server / build:** `npm run dev`, `npm run build`, `npm run start`

### Infrastructure & DevOps
- **Orchestration:** Docker Compose (`docker/docker-compose.yml`)
- **Services:**
  - `db` (PostgreSQL 16)
  - `backend` (FastAPI + Uvicorn)
  - `frontend` (Next.js dev server)
- **Images:**
  - Backend: `docker/backend.Dockerfile`
  - Frontend: `docker/frontend.Dockerfile`
- **Shared code:** `shared/` mounted into containers as `/app/shared`

---

## Documentation

- **Project structure & local development**  
  See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for:
  - Directory layout
  - Backend and frontend internals
  - Typical dev workflow

- **Deployment (dev & live)**  
  See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for:
  - Running the stack locally with and without Docker
  - Live / production deployment steps
  - Notes on using a registry and single‑server setups

---

## Quick Start (Very Short Version)

1. **Backend (no Docker)**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL="postgresql+asyncpg://USER:PASSWORD@localhost:5432/DB_NAME"
   export JWT_SECRET="dev-secret-change-me"
   uvicorn backend.presentation.app:app --reload --port 8000
   ```

2. **Frontend (no Docker)**
   ```bash
   cd frontend
   npm install
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
   npm run dev
   ```

3. **Full stack with Docker**
   ```bash
   cd docker
   cp .env.example .env  # edit values
   docker compose up --build
   ```

For more details, refer to the linked docs above.
