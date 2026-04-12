"""Tests for usage tracking helpers."""

from foundry_backend.services.usage import extract_city_from_headers, normalize_city


def test_extract_city_from_headers_prefers_known_geo_headers() -> None:
    headers = {
        "x-geo-city": "San Francisco",
        "x-forwarded-for": "203.0.113.2",
    }

    assert extract_city_from_headers(headers) == "San Francisco"


def test_extract_city_from_headers_returns_unknown_when_missing() -> None:
    assert extract_city_from_headers({"x-forwarded-for": "203.0.113.2"}) == "Unknown"


def test_normalize_city_handles_empty_and_delimited_values() -> None:
    assert normalize_city("") == "Unknown"
    assert normalize_city("Seattle, WA") == "Seattle"
    assert normalize_city("San+Francisco") == "San Francisco"
