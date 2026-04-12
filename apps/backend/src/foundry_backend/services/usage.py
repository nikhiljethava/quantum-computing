"""Helpers for page-usage tracking and lightweight geo extraction."""

from __future__ import annotations

from collections.abc import Mapping


KNOWN_CITY_HEADERS = (
    "x-geo-city",
    "x-client-geo-city",
    "x-appengine-city",
    "x-vercel-ip-city",
    "cf-ipcity",
)


def normalize_city(value: str | None) -> str:
    """Normalize a city-like header value into a short display string."""

    if not value:
        return "Unknown"

    cleaned = value.strip().strip('"').replace("+", " ")
    if not cleaned:
        return "Unknown"

    if "," in cleaned:
        cleaned = cleaned.split(",", 1)[0].strip()

    return cleaned[:100] if cleaned else "Unknown"


def extract_city_from_headers(headers: Mapping[str, str]) -> str:
    """Resolve city from known proxy/CDN headers.

    Direct Cloud Run URLs do not provide city headers by default. This helper is
    designed to work with geo headers forwarded by a load balancer/CDN or other
    trusted proxy and falls back to ``Unknown`` otherwise.
    """

    lower_headers = {key.lower(): value for key, value in headers.items()}

    for header_name in KNOWN_CITY_HEADERS:
        city = normalize_city(lower_headers.get(header_name))
        if city != "Unknown":
            return city

    return "Unknown"
