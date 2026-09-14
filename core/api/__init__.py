"""Standardized API response layer.

This package implements the Agreed Response Standard for the PetShop API:

* Every responses is wrapped in a predictable envelope
* Semantic HTTP status codes (never `200 + success: false`)
* `meta` only carries metadata (request_id, timestamp, pagination)
* Validation errors are per-field lists of ``{code, message}``
* Clients may opt out of the envelope with ``X-PetShop-Envelope: 0``
  or ``?envelope=false`` (backward-compatible migration path)
"""