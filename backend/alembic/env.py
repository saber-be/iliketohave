from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
import os
import sys

# Ensure the project root (which contains the 'backend' package) is on sys.path.
#
# In Docker, the backend code lives under /app/backend and alembic.ini is at /app.
# We default PROJECT_ROOT to /app, but allow overriding via the PROJECT_ROOT env var
# for local development.
PROJECT_ROOT = os.getenv("PROJECT_ROOT", "/app")
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from backend.infrastructure.db.models import Base  # adjust this import to your project

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

DATABASE_URL = os.getenv("DATABASE_URL")

def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    engine = create_async_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await engine.dispose()


def do_run_migrations(connection: Connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
