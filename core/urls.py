"""URL routes for the legacy server-rendered HTML layer.

This project is API-first: the site is a React SPA (see frontend/) that talks to
the DRF endpoints mounted at /api/ in core/api_urls. There are no server-rendered
HTML pages anymore (core/templates/bootstrap/ removed and core/views.py trimmed),
so this router intentionally exposes no HTML page URLs.

Keeping this module present (empty) so that config.urls -> include('core.urls')
continues to resolve and the `core` app stays registered. Remove the include()
from config/urls if/when the HTML routes are fully dropped.
"""

from django.urls import path

urlpatterns: list = []
