"""Demo mock endpoints for the response standard.

Enabled only when ``settings.ENABLE_MOCKS = True`` (see ``config/settings.py``).
These mirror the real API envelopes so the frontend can be built and verified
before the real data sources exist.
"""
from __future__ import annotations

from datetime import date, timedelta

import redis
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view

from .responses import AppResponse

DEMO_ORDERS = [
    {
        "id": 1,
        "client": "Aziz Karimov",
        "product": "Royal Canin Dog Food 10kg",
        "quantity": 2,
        "amount": "780,000",
        "status": "pending",
    },
    {
        "id": 2,
        "client": "Madina Yusupova",
        "product": "PawPad Cat Scratcher",
        "quantity": 1,
        "amount": "120,000",
        "status": "delivered",
    },
    {
        "id": 3,
        "client": "Jasur Toshmatov",
        "product": "AquaFilter 3000",
        "quantity": 1,
        "amount": "340,000",
        "status": "confirmed",
    },
]


def _mock_enabled():
    return getattr(settings, "ENABLE_MOCKS", False)


@api_view(['GET'])
def mock_summary(request):
    if not _mock_enabled():
        return AppResponse.error("Mock endpoints are disabled.", "mocks_disabled", status_code=status.HTTP_404_NOT_FOUND)
    today = date.today()
    return AppResponse.success({
        "today_orders": 12 + (today.day % 7),
        "today_revenue": "4,350,000",
        "active_appointments": 6,
        "low_stock_products": 3,
        "week": {
            "start": (today - timedelta(days=today.weekday())).isoformat(),
            "end": (today - timedelta(days=today.weekday() - 6)).isoformat(),
        },
    })


@api_view(['GET'])
def mock_orders(request):
    if not _mock_enabled():
        return AppResponse.error("Mock endpoints are disabled.", "mocks_disabled", status_code=status.HTTP_404_NOT_FOUND)
    limit = int(request.query_params.get("limit", 0) or 0)
    page = request.query_params.get("page")
    if page and page.lower() == "2":
        return AppResponse.error(
            "No more results.", "out_of_bounds",
            fields=[{"field": "page", "code": "out_of_bounds", "message": "Page 2 does not exist."}],
            status_code=status.HTTP_404_NOT_FOUND,
        )
    data = DEMO_ORDERS[:limit] if limit else DEMO_ORDERS
    return AppResponse.success(data, message="Mock order feed (for frontend development only).")


@api_view(['GET'])
def mock_ping(request):
    """Cheap latency/smoke probe used by monitoring. Also reports Redis/Celery health."""
    # Healthy results are cached briefly so monitoring doesn't open 3 TCP
    # connections per poll; degraded states are always re-checked fresh.
    cached = cache.get('healthcheck:ping')
    if cached:
        return AppResponse.success(cached)

    redis_up = False
    try:
        client = redis.Redis.from_url(settings.REDIS_URL)
        redis_up = bool(client.ping())
    except Exception:
        redis_up = False

    cache_up = False
    try:
        cache.set('healthcheck', 'ok', timeout=30)
        cache_up = cache.get('healthcheck') == 'ok'
    except Exception:
        cache_up = False

    broker_up = False
    try:
        from config.celery import app as celery_app

        connection = celery_app.connection()
        connection.connect()
        broker_up = bool(connection.connected)
        connection.close()
    except Exception:
        broker_up = False

    healthy = redis_up and cache_up and broker_up
    payload = {
        "service": "petshop-api",
        "version": "1.0.0",
        "envelope": True,
        "health": "ok" if healthy else "degraded",
        "redis": redis_up,
        "cache": cache_up,
        "celery_broker": broker_up,
        "timestamp": timezone.now().isoformat(),
    }
    cache.set('healthcheck:ping', payload, timeout=15)
    return AppResponse.success(payload)


@api_view(['GET'])
def mock_task_status(request, task_id):
    """Poll the AsyncResult for a previously enqueued demo task."""
    from celery.result import AsyncResult

    result = AsyncResult(str(task_id))
    payload = {
        "task_id": task_id,
        "state": result.state,
        "ready": result.ready(),
    }
    if result.ready():
        payload["result"] = result.result if result.successful() else str(result.info)
    return AppResponse.success(payload)


@api_view(['POST'])
def mock_task(request):
    """Enqueue a synthetic Celery task to exercise the broker/worker pipeline."""
    from ..tasks import demo_task

    if not _mock_enabled():
        return AppResponse.error("Mock endpoints are disabled.", "mocks_disabled", status_code=status.HTTP_404_NOT_FOUND)

    name = request.data.get('name', 'world')
    try:
        result = demo_task.delay(name=name)
    except Exception as exc:
        return AppResponse.error(
            f"Could not enqueue the task — is the broker running? ({exc})",
            "broker_unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return AppResponse.success({
        "task": "core.tasks.demo_task",
        "task_id": result.id,
        "state": result.state,
        "status_url": f"/api/mocks/task/{result.id}/",
    })