#!/usr/bin/env sh
set -e

# Default to development if not explicitly set
APP_ENV="${APP_ENV:-development}"

# Run database migrations before starting the app
alembic upgrade head

if [ "$APP_ENV" = "production" ]; then
  exec uvicorn backend.presentation.app:app --host 0.0.0.0 --port 8000
else
  exec uvicorn backend.presentation.app:app --host 0.0.0.0 --port 8000 --reload
fi
