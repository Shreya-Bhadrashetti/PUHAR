"""Redis-backed cache with an in-process fallback for local demos and outages."""
from __future__ import annotations

import json
import time
from typing import Any

from backend.app.core.config import get_settings


class Cache:
    def __init__(self) -> None:
        self._memory: dict[str, tuple[float, Any]] = {}
        self._client = None
        try:
            import redis
            self._client = redis.from_url(get_settings().redis_url, decode_responses=True)
        except Exception:
            pass

    def get(self, key: str) -> Any | None:
        try:
            if self._client:
                value = self._client.get(key)
                return json.loads(value) if value else None
        except Exception:
            pass
        value = self._memory.get(key)
        return value[1] if value and value[0] > time.time() else None

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        try:
            if self._client:
                self._client.setex(key, ttl_seconds, json.dumps(value, default=str))
                return
        except Exception:
            pass
        self._memory[key] = (time.time() + ttl_seconds, value)


cache = Cache()
