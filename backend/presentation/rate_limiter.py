from __future__ import annotations

import os
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from fastapi import HTTPException, Request, status

try:
    import redis.asyncio as redis
except Exception:  # pragma: no cover
    redis = None


@dataclass(frozen=True, slots=True)
class RateLimit:
    action: str
    limit: int
    window_seconds: int


class _InMemoryRateLimiter:
    def __init__(self) -> None:
        self._store: dict[str, tuple[int, float]] = {}

    async def hit(self, key: str, window_seconds: int) -> tuple[int, int]:
        now = time.time()
        count, reset_at = self._store.get(key, (0, now + window_seconds))

        if now >= reset_at:
            count = 0
            reset_at = now + window_seconds

        count += 1
        self._store[key] = (count, reset_at)
        retry_after = max(0, int(reset_at - now))
        return count, retry_after


_memory_limiter = _InMemoryRateLimiter()
_redis_client: "redis.Redis | None" = None


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client is None:
        return "unknown"

    return request.client.host


async def _redis_hit(key: str, window_seconds: int) -> tuple[int, int]:
    global _redis_client

    if redis is None:
        return await _memory_limiter.hit(key=key, window_seconds=window_seconds)

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return await _memory_limiter.hit(key=key, window_seconds=window_seconds)

    if _redis_client is None:
        _redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)

    pipe = _redis_client.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    count, ttl = await pipe.execute()

    if ttl == -1:
        await _redis_client.expire(key, window_seconds)
        ttl = window_seconds
    elif ttl == -2:
        await _redis_client.expire(key, window_seconds)
        ttl = window_seconds

    retry_after = max(0, int(ttl))
    return int(count), retry_after


async def enforce_rate_limit(request: Request, rl: RateLimit) -> None:
    ip = _get_client_ip(request)
    key = f"rl:{rl.action}:{ip}"

    count, retry_after = await _redis_hit(key=key, window_seconds=rl.window_seconds)

    if count > rl.limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit(action: str, limit: int, window_seconds: int) -> Callable[[Request], Awaitable[None]]:
    rl = RateLimit(action=action, limit=limit, window_seconds=window_seconds)

    async def _dep(request: Request) -> None:
        await enforce_rate_limit(request=request, rl=rl)

    return _dep
