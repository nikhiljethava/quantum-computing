"""Tests for Cloud Run frontend access-mode deployment guardrails."""

from __future__ import annotations

import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
CHECK_SCRIPT = REPO_ROOT / "scripts" / "check-frontend-access.sh"
CONFIGURE_SCRIPT = REPO_ROOT / "scripts" / "configure-frontend-access.sh"
CLOUDBUILD = REPO_ROOT / "cloudbuild.yaml"


def _run_check(tmp_path: Path, headers: str, mode: str) -> subprocess.CompletedProcess[str]:
    headers_file = tmp_path / "headers.txt"
    headers_file.write_text(headers, encoding="utf-8")
    return subprocess.run(
        ["bash", str(CHECK_SCRIPT), "--mode", mode, "--headers-file", str(headers_file)],
        check=False,
        text=True,
        capture_output=True,
    )


def test_public_mode_fails_on_iap_generated_response(tmp_path: Path) -> None:
    result = _run_check(
        tmp_path,
        "HTTP/2 302\nx-goog-iap-generated-response: true\nlocation: https://accounts.google.com/o/oauth2/v2/auth\n",
        "public",
    )

    assert result.returncode == 1
    assert "Cloud Run IAP is intercepting this URL" in result.stderr


def test_public_mode_fails_on_google_oauth_redirect(tmp_path: Path) -> None:
    result = _run_check(
        tmp_path,
        "HTTP/2 302\nlocation: https://accounts.google.com/o/oauth2/v2/auth?client_id=abc\n",
        "public",
    )

    assert result.returncode == 1
    assert "Disable IAP" in result.stderr


def test_public_mode_fails_on_auth_status(tmp_path: Path) -> None:
    result = _run_check(tmp_path, "HTTP/2 403\ncontent-type: text/html\n", "public")

    assert result.returncode == 1
    assert "authentication-related 401/403" in result.stderr


def test_public_mode_passes_normal_app_response(tmp_path: Path) -> None:
    result = _run_check(tmp_path, "HTTP/2 200\ncontent-type: text/html\n", "public")

    assert result.returncode == 0
    assert "PASS: public frontend access" in result.stdout


def test_iap_protected_mode_passes_iap_intercept(tmp_path: Path) -> None:
    result = _run_check(
        tmp_path,
        "HTTP/2 302\nx-goog-iap-generated-response: true\nlocation: https://accounts.google.com/o/oauth2/v2/auth\n",
        "iap-protected",
    )

    assert result.returncode == 0
    assert "PASS: iap-protected frontend access" in result.stdout


def test_cloudbuild_uses_explicit_frontend_access_mode() -> None:
    text = CLOUDBUILD.read_text(encoding="utf-8")

    assert "_FRONTEND_ACCESS_MODE: public" in text
    assert "--no-allow-unauthenticated" in text
    assert "scripts/configure-frontend-access.sh" in text
    assert "scripts/check-frontend-access.sh" in text
    assert "--allow-unauthenticated \\" not in text.split("id: deploy-frontend-and-finalize-cors", 1)[1]


def test_configure_script_has_public_and_iap_paths() -> None:
    text = CONFIGURE_SCRIPT.read_text(encoding="utf-8")

    assert "--no-iap" in text
    assert "--no-invoker-iam-check" in text
    assert "--iap" in text
    assert "gcp-sa-iap.iam.gserviceaccount.com" in text
    assert "roles/iap.httpsResourceAccessor" in text
