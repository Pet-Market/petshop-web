"""Global exception handler -> standardized error envelope.

Maps every DRF/Django exception to ``{code, message, errors}`` which the
``AppJSONRenderer`` wraps into the final error envelope.
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .exceptions import AppAPIException

logger = logging.getLogger(__name__)

# stable error code per exception type
CODES = {
    exceptions.NotAuthenticated: "not_authenticated",
    exceptions.AuthenticationFailed: "authentication_failed",
    exceptions.PermissionDenied: "permission_denied",
    exceptions.NotFound: "not_found",
    exceptions.MethodNotAllowed: "method_not_allowed",
    exceptions.NotAcceptable: "not_acceptable",
    exceptions.UnsupportedMediaType: "unsupported_media_type",
    exceptions.Throttled: "throttled",
    exceptions.ParseError: "parse_error",
}


def _serialize_errors(detail) -> list[dict]:
    """Flatten DRF error detail into ``[{field, code, message}]``.

    Handles strings, flat ErrorDetail lists and nested dicts (nested
    serializers keep their dotted field path, e.g. ``items.quantity``).
    """
    out: list[dict] = []

    def walk(node, prefix=""):
        if isinstance(node, dict):
            for key, value in node.items():
                field = f"{prefix}.{key}" if prefix else str(key)
                if isinstance(value, (list, tuple)) and value and not isinstance(value[0], (dict, list)):
                    for item in value:
                        out.append(_make_error(field, item))
                else:
                    walk(value, field)
        elif isinstance(node, (list, tuple)):
            for item in node:
                if isinstance(item, dict):
                    walk(item, prefix)
                else:
                    out.append(_make_error(prefix or "non_field_errors", item))
        else:
            out.append(_make_error(prefix or "non_field_errors", node))

    walk(detail)
    return out or [{"field": "non_field_errors", "code": "invalid", "message": "Request is invalid."}]


def _make_error(field, item) -> dict:
    code = getattr(item, "code", None) or "invalid"
    message = str(item)
    if isinstance(item, str):
        message = item
    return {"field": field, "code": code, "message": message}


def _simple_error(code: str, message: str) -> dict:
    return {"code": code, "message": message, "errors": [{"field": None, "code": code, "message": message}]}


def app_exception_handler(exc, context):
    """DRF global exception handler (wires both DRF and plain Django errors)."""

    # Our own, explicit errors first -> keeps the given code/errors/status.
    if isinstance(exc, AppAPIException):
        errors = exc.errors or [{
            "field": None,
            "code": exc.error_code,
            "message": exc._default_message,
        }]
        return Response(
            {"code": exc.error_code, "message": exc._default_message, "errors": errors},
            status=exc.status_code,
            headers=getattr(exc, "get_full_details", lambda: {})().get("headers") or getattr(exc, "headers", None),
        )

    # Validation errors -> per-field (incl. nested serializers) 422 envelope.
    if isinstance(exc, exceptions.ValidationError):
        errors = _serialize_errors(exc.detail)
        return Response(
            {"code": "validation_error", "message": "Request validation failed.", "errors": errors},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if isinstance(exc, Http404):
        return Response(_simple_error("not_found", "The requested resource was not found."),
                        status=status.HTTP_404_NOT_FOUND)

    if isinstance(exc, DjangoPermissionDenied):
        return Response(_simple_error("permission_denied", "You do not have permission to perform this action."),
                        status=status.HTTP_403_FORBIDDEN)

    if isinstance(exc, exceptions.Throttled):
        return Response(
            _simple_error("throttled", "Request was throttled. Try again later."),
            status=status.HTTP_429_TOO_MANY_REQUESTS,
            headers=getattr(exc, "headers", None),
        )

    # Any other DRF APIException with a stable code
    if isinstance(exc, exceptions.APIException):
        code = CODES.get(type(exc), "api_error")
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return Response(_simple_error(code, detail or "Request failed."), status=exc.status_code,
                        headers=getattr(exc, "headers", None))

    # The generic DRF handler still resolves authentication contexts.
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    # Unexpected 500s are logged in full but hidden from the client.
    logger.exception("Unhandled API exception: %s", exc)
    message = "Internal server error." if not settings.DEBUG else str(exc)
    return Response(_simple_error("internal_server_error", message),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR)