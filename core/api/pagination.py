"""Pagination classes for the response standard."""
from __future__ import annotations

from collections import OrderedDict

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Page-based pagination that exposes a dedicated ``pagination`` block.

    The ``AppJSONRenderer`` moves this block into ``meta.pagination`` and
    exposes the page items as ``data``.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ("results", data),
            ("pagination", self._pagination_meta()),
        ]))

    def _pagination_meta(self) -> dict:
        return {
            "page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "total": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "has_next": self.page.has_next(),
            "has_previous": self.page.has_previous(),
        }