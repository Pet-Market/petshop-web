"""Redis-backed caching helpers.

Design points
-------------
* Every callable result is cached under a *versioned* key. Writing a model
  ``bump()``s the entity version so a new key is used and the stale one simply
  expires by TTL — no key-list scanning needed, works on any cache backend.
* All Redis operations are wrapped so a temporarily-unreachable Redis degrades
  to a cache miss instead of a 500 (the app keeps working without caching).
* ``refresh=1`` on an endpoint bypasses the cache and re-warms it.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def build_key(*parts) -> str:
    """Normalise cache key parts (None/'' -> '-') joined by ':'."""
    return ':'.join(str(p) if p not in (None, '') else '-' for p in parts)


def _entity_version(entity: str) -> int:
    try:
        cached = cache.get(f'ver::{entity}')
    except Exception:
        logger.warning('cache.get(ver::%s) failed', entity, exc_info=True)
        return 1
    if cached is not None:
        return int(cached)
    try:
        cache.set(f'ver::{entity}', 1, timeout=86400)
    except Exception:
        logger.warning('cache.set(ver::%s) failed', entity, exc_info=True)
    return 1


def bump(entity: str) -> None:
    """Invalidate all keys of an entity by rotating its version counter."""
    key = f'ver::{entity}'
    try:
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 2, timeout=86400)
    except Exception:
        logger.warning('bump(%s) failed', entity, exc_info=True)


def cache_get_or_set(key: str, fn, timeout: int | None = None):
    """``cache.get_or_set`` with a callable and graceful Redis fallback."""
    try:
        cached = cache.get(key)
        if cached is not None:
            return cached
    except Exception:
        logger.warning('cache.get(%s) failed', key, exc_info=True)

    value = fn()

    try:
        cache.set(key, value, timeout=timeout or settings.CACHE_TTL_CATALOG)
    except Exception:
        logger.warning('cache.set(%s) failed', key, exc_info=True)
    return value


def catalog_version(entity: str) -> int:
    """Version for read-mostly catalogs keyed into product/detail cache keys."""
    return _entity_version(entity)