"""Envelope renderer + AppResponse helpers (the response standard).

Envelope shapes
---------------

Success (single)::

    {
        "success": true,
        "data": { ... },
        "message": null,
        "meta": {"request_id": "...", "timestamp": "..."},
        "errors": null
    }

Success (list)::

    {
        "success": true,
        "data": [ ... ],
        "message": null,
        "meta": {
            "request_id": "...",
            "timestamp": "...",
            "pagination": {
                "page": 1, "page_size": 20, "total": 57,
                "total_pages": 3, "has_next": true, "has_previous": false
            }
        },
        "errors": null
    }

Error::

    {
        "success": false,
        "data": null,
        "message": "The order quantity is invalid.",
        "meta": {"request_id": "...", "timestamp": "..."},
        "errors": [
            {"field": "quantity", "code": "invalid", "message": "Only 3 item(s) available in stock."}
        ]
    }

Error codes: ``not_authenticated``, ``permission_denied``, ``not_found``,
``already_exists``, ``validation_error``, ``internal_server_error``, ...

Security: error payloads never include tracebacks, SQL, tokens or secrets.
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.settings import api_settings

REQUEST_ID_HEADER = "X-Request-ID"
ENVELOPE_HEADER = "X-PetShop-Envelope"

__all__ = ["AppResponse", "AppJSONRenderer", "REQUEST_ID_HEADER", "ENVELOPE_HEADER"]


def _now_iso() -> str:
    return timezone.now().isoformat()


def _meta(request, extra: dict | None = None) -> dict:
    meta = {
        "request_id": getattr(request, "id", None) or "",
        "timestamp": _now_iso(),
    }
    if extra:
        meta.update(extra)
    return meta


def _error_items(data) -> list[dict]:
    """Normalise an error payload into a list of ``{field, code, message}``."""
    if isinstance(data, dict):
        code = data.get("code") or "error"
        message = data.get("message") or data.get("detail") or "Request failed."
        errors = data.get("errors")
        if errors:
            return errors
        field = data.get("field")
        return [{"field": field, "code": code, "message": message}]
    if isinstance(data, (list, tuple)):
        if data and all(isinstance(i, dict) for i in data):
            return [*data]
        return [{"field": None, "code": "error", "message": str(data[0]) if data else "Request failed."}]
    return [{"field": None, "code": "error", "message": str(data or "Request failed.")}]


def _unwrap_requested(request) -> bool:
    """Return ``True`` when the client wants the raw (pre-envelope) payload.

    Backward-compatible migration path: old clients send
    ``X-PetShop-Envelope: 0`` / ``?envelope=false`` and keep getting raw JSON.
    """
    if request is None:
        return False
    header = request.headers.get(ENVELOPE_HEADER)
    if header is not None:
        return header.strip().lower() in {"0", "false", "no"}
    return request.query_params.get("envelope", "").strip().lower() in {"0", "false", "no"}


def _split_paginated(data):
    """Detect ``{results, pagination}`` payloads from StandardPagination."""
    return (isinstance(data, dict) and "results" in data and "pagination" in data) or (
        isinstance(data, dict) and "results" in data
    )


class AppJSONRenderer(JSONRenderer):
    """Wraps every DRF response into the standardized envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        request = renderer_context.get("request")
        response = renderer_context.get("response")

        if _unwrap_requested(request):
            return super().render(data, accepted_media_type, renderer_context)

        # Already-enveloped payload (built via AppResponse helpers): pass through.
        if isinstance(data, dict) and "success" in data and "data" in data:
            return super().render(data, accepted_media_type, renderer_context)

        status_code = response.status_code if response is not None else status.HTTP_200_OK
        is_error = (response is not None and response.exception) or status_code >= 400

        if is_error:
            envelope = {
                "success": False,
                "data": None,
                "message": data.get("message") if isinstance(data, dict) else "Request failed.",
                "meta": _meta(request),
                "errors": _error_items(data),
            }
        elif _split_paginated(data):
            pagination = data["pagination"] if "pagination" in data else _derive_pagination(data)
            envelope = {
                "success": True,
                "data": data["results"],
                "message": None,
                "meta": _meta(request, {"pagination": pagination}),
                "errors": None,
            }
        else:
            envelope = {
                "success": True,
                "data": data,
                "message": None,
                "meta": _meta(request),
                "errors": None,
            }
        return super().render(envelope, accepted_media_type, renderer_context)


def _derive_pagination(data: dict) -> dict:
    """Reconstruct a pagination block from default DRF output (count/next/previous/results)."""
    count = data.get("count", 0)
    page_size = api_settings.PAGE_SIZE or count or 1
    page = 1
    if data.get("previous"):
        # previous=...page=2&page_size=20 -> current page = 2
        try:
            page = int(data["previous"].rsplit("page=", 1)[1].split("&")[0]) + 1
        except (ValueError, IndexError, AttributeError):
            page = 1
    return {
        "page": page,
        "page_size": page_size,
        "total": count,
        "total_pages": (count + page_size - 1) // page_size,
        "has_next": bool(data.get("next")),
        "has_previous": bool(data.get("previous")),
    }


class AppResponse:
    """Explicit helper for building envelope responses in views.

    The ``AppJSONRenderer`` wraps plain DRF ``Response`` objects
    automatically, so this helper is only needed when a view wants to set
    ``message`` or hand-build an error envelope.
    """

    @staticmethod
    def success(data=None, message: str | None = None, status_code: int = status.HTTP_200_OK, **headers) -> Response:
        return Response({"success": True, "data": data, "message": message}, status=status_code, headers=headers)

    @staticmethod
    def created(data=None, message: str | None = None, **headers) -> Response:
        return AppResponse.success(data, message, status.HTTP_201_CREATED, **headers)

    @staticmethod
    def no_content(**headers) -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT, headers=headers)

    @staticmethod
    def error(
        message: str,
        error_code: str,
        fields: list | None = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        **headers,
    ) -> Response:
        return Response(
            {
                "code": error_code,
                "message": message,
                "errors": fields or [{"field": None, "code": error_code, "message": message}],
            },
            status=status_code,
            headers=headers,
        )