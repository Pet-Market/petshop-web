"""Request-ID middleware for the response standard."""
from __future__ import annotations

import logging
import re
import uuid

from .responses import REQUEST_ID_HEADER

logger = logging.getLogger(__name__)

_VALID_ID = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


class RequestIdMiddleware:
    """Assign every request an id and echo it on the response.

    * Uses the client-provided ``X-Request-ID`` when valid (dedupe-friendly
      for retries and trace logs), otherwise generates a fresh UUID.
    * Stores the id on ``request.id`` so renderers and loggers can use it.
    * Always reflects ``X-Request-ID`` back on the outgoing response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.id = self._resolve(request)
        response = self.get_response(request)
        response[REQUEST_ID_HEADER] = request.id
        return response

    @staticmethod
    def _resolve(request) -> str:
        supplied = request.META.get("HTTP_X_REQUEST_ID", "").strip()
        if supplied and _VALID_ID.match(supplied):
            return supplied
        return str(uuid.uuid4())