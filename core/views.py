"""HTML (server-rendered) views for the legacy core app.

Removed on <deploy>: this project is API-first. The browser UI is a React SPA in
frontend/ that talks to the DRF endpoints under /api/. The legacy Django ``core``
server-rendered templates were deleted; the view functions that rendered them were
removed so nothing references deleted templates at runtime.

All business logic, models, serializers, DRF endpoints, admin, migrations,
Celery tasks and static handling were deliberately left untouched.
"""
