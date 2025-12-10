# Deployment Guide

This document describes how to run the project in **development** and how to deploy a **live environment** using Docker.

- Backend: FastAPI (`backend/`)
- Frontend: Next.js (`frontend/`)
- Orchestration: Docker Compose (`docker/docker-compose.yml`)

---

## 1. Development Environment

You have two main options:

- **A. Local dev without Docker** (run backend and frontend directly)
- **B. Local dev with Docker Compose** (db + backend + frontend together)

### A. Local Dev without Docker

#### 1. Backend (FastAPI)

Requirements:
- Python 3.11+
- PostgreSQL running locally

Steps:

1. **Create and activate virtualenv, install deps**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set environment variables**
   Configure values appropriate for your local DB and secrets:
   ```bash
   export DATABASE_URL="postgresql+asyncpg://USER:PASSWORD@localhost:5432/DB_NAME"
   export JWT_SECRET="dev-secret-change-me"
   export JWT_ALGORITHM="HS256"
   export ACCESS_TOKEN_EXPIRES_MIN=60
   ```

3. **Run the backend server**
   The Dockerfile uses `backend.presentation.app:app` as the FastAPI entrypoint. Use the same for dev:
   ```bash
   uvicorn backend.presentation.app:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Check the API**
   - Base URL: `http://localhost:8000`
   - Docs (if enabled): `http://localhost:8000/docs`

---

#### 2. Frontend (Next.js)

Requirements:
- Node.js 20+ (LTS recommended)

Steps:

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API base URL**
   Create `frontend/.env.local` and set:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

4. **Check the app**
   - Frontend: `http://localhost:3000`

---

### B. Local Dev with Docker

This uses `docker/docker-compose.yml` to run **PostgreSQL**, **backend**, and **frontend** together.

#### 1. Prepare environment

1. Copy and edit the Docker env file:
   ```bash
   cd docker
   cp .env.example .env
   ```

2. Open `.env` and set values:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `JWT_SECRET`
   - (optional, for host port mapping on your machine/VPS)
     - `DB_PORT` (default `5432`)
     - `BACKEND_PORT` (default `8000`)
     - `FRONTEND_PORT` (default `3000`)

`docker-compose.yml` will construct `DATABASE_URL` for the backend as:
```yaml
database_url: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

The frontend uses:
```yaml
NEXT_PUBLIC_API_BASE_URL: http://backend:8000
```
inside the Docker network.

#### 2. Start services

From the `docker/` directory:

```bash
docker compose up --build
```

This will:
- Start `db` (PostgreSQL 16)
- Build and start `backend` using `docker/backend.Dockerfile`
- Build and start `frontend` using `docker/frontend.Dockerfile` (runs `npm run dev`)

You can then access (using the host ports you configured):
- Backend: `http://localhost:${BACKEND_PORT}` (default `8000`)
- Frontend: `http://localhost:${FRONTEND_PORT}` (default `3000`)

#### 3. Stop services

```bash
docker compose down
```

#### 4. Live code reload in Docker

`docker-compose.yml` mounts your source directories:
- `../backend` → `/app/backend`
- `../frontend` → `/app/frontend`
- `../shared` → `/app/shared`

This allows you to edit code on the host and see changes inside containers (depending on FastAPI and Next.js reload settings, which are enabled via `--reload` and `npm run dev`).

---

## 2. Live / Production Deployment

There are many ways to run this in production; this section describes a **simple single-server Docker deployment** using the same Dockerfiles.

### Option 1: Single Server with Docker Compose

#### 1. Prepare a deployment server

On your target server (e.g. cloud VM):

- Install:
  - Docker
  - Docker Compose (or `docker compose` CLI plugin)
- Ensure ports are free:
  - `80`/`443` for HTTP/HTTPS (you might front with a reverse proxy like Nginx/Traefik)
  - `8000` (backend, if exposed) and `3000` (frontend, if exposed) or map them behind a proxy.

#### 2. Copy the project to the server

Typical approach:

```bash
# On your local machine
scp -r iliketohave USER@SERVER:/opt/iliketohave
```

On the server, go to the project:

```bash
cd /opt/iliketohave/docker
```

#### 3. Configure production environment

Edit `/opt/iliketohave/docker/.env` with **strong, non-dev values**:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_SECRET` (long random secret)
- (add any other envs you need, e.g. CORS, logging level, etc.)

Ensure that `docker-compose.yml` ports are mapped as desired for production via the env vars in `docker/.env`.

For example, if this project shares a VPS with others, you might set:

- `BACKEND_PORT=8100`
- `FRONTEND_PORT=3100`

Then Docker will expose:

- Backend: `8100:8000`
- Frontend: `3100:3000`

You may later choose to **only expose frontend publicly** and route backend through an internal network.

#### 4. Build and run in detached mode

From the `docker/` directory on the server:

```bash
docker compose up --build -d
```

- `-d` runs containers in the background.
- Containers use the same `backend.Dockerfile` and `frontend.Dockerfile` as in dev.

Check status:

```bash
docker compose ps
```

View logs (for debugging):

```bash
docker compose logs -f backend
# or
docker compose logs -f frontend
```

#### 5. Access the live app

Depending on your server’s firewall, DNS, and chosen ports:

- Frontend (Next.js): `http://YOUR_SERVER_IP:${FRONTEND_PORT}`
- Backend (FastAPI): `http://YOUR_SERVER_IP:${BACKEND_PORT}`

You can put a reverse proxy (Nginx/Traefik/Caddy) in front to:
- Terminate TLS (HTTPS)
- Expose clean domains, e.g. `https://app.example.com`

### Option 2: Build and Push Images to a Registry

If you prefer separate build and run stages (CI/CD), you can:

1. **Build backend image**
   ```bash
   docker build -t your-registry/iliketohave-backend:TAG -f docker/backend.Dockerfile .
   ```

2. **Build frontend image**
   ```bash
   docker build -t your-registry/iliketohave-frontend:TAG -f docker/frontend.Dockerfile .
   ```

3. **Push images**
   ```bash
   docker push your-registry/iliketohave-backend:TAG
   docker push your-registry/iliketohave-frontend:TAG
   ```

4. **On the server**, use a `docker-compose.yml` (or Kubernetes manifest) that **pulls** these images instead of building from source.

This lets you:
- Build images in CI
- Run only trusted, versioned images in production

---

## 3. Summary

- **Dev without Docker**
  - Backend: `uvicorn backend.presentation.app:app --reload` on port 8000
  - Frontend: `npm run dev` on port 3000, `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

- **Dev with Docker**
  - From `docker/`: `docker compose up --build`
  - Uses local bind mounts for fast iteration

- **Live deployment (simple)**
  - Copy project to server
  - Configure strong secrets in `docker/.env`
  - `docker compose up --build -d`
  - Optionally front with a reverse proxy and TLS

Adjust ports, domains, and environment variables as needed for your infrastructure and security policies.
