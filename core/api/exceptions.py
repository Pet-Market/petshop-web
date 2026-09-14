"""Standard exceptions mapped to the response standard error codes."""
from __future__ import annotations

from rest_framework.exceptions import APIException
from rest_framework import status


class AppAPIException(APIException):
    """Base error for the PetShop API response standard.

    Raise inside views to get a stable ``code`` and an optional per-field
    ``errors`` list in the error envelope.
    """

    error_code: str = "error"
    default_message: str = "Request failed."

    def __init__(self, detail=None, code: str | None = None, errors: list | None = None,
                 status_code: int | None = None, headers: dict | None = None):
        self.error_code = code or self.error_code
        self._default_message = isinstance(detail, str) and detail or self.default_message
        self.errors = errors
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail or self.default_message, headers=headers)


class NotFoundException(AppAPIException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"
    default_message = "Requested resource was not found."


class AlreadyExistsException(AppAPIException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "already_exists"
    default_message = "A resource with this data already exists."


class UnauthorizedException(AppAPIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "not_authenticated"
    default_message = "Authentication credentials were not provided."


class PermissionDeniedException(AppAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "permission_denied"
    default_message = "You do not have permission to perform this action."


class InvalidRequestException(AppAPIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_error"
    default_message = "The request payload is invalid."

    def __init__(self, errors: list, detail: str | None = None, **kwargs):
        self.errors = errors
        super().__init__(detail=detail, **kwargs)


class InternalServerException(AppAPIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "internal_server_error"
    default_message = "Internal server error."