"""Article 4 deployment and integration contracts; numerical tests live in the frontend."""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _read(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def test_article4_public_url_reaches_the_actual_frontend_build() -> None:
    dockerfile = _read("apps/frontend/Dockerfile")
    cloudbuild = _read("cloudbuild.yaml")
    compose = _read("docker-compose.yml")
    environment = _read(".env.example")
    frontend_step = cloudbuild.split("id: build-frontend", 1)[1].split("id: push-frontend", 1)[0]

    for article in ("01", "02", "04"):
        variable = f"NEXT_PUBLIC_SERIES_ARTICLE_{article}_URL"
        substitution = f"_SERIES_ARTICLE_{article}_URL"
        assert f'ARG {variable}=""' in dockerfile
        assert f"ENV {variable}=${{{variable}}}" in dockerfile
        assert dockerfile.index(f"ENV {variable}=") < dockerfile.index("RUN npm run build")
        assert f'{substitution}: ""' in cloudbuild
        assert f"{variable}=${{{substitution}}}" in frontend_step
        assert f"--build-arg {variable}" in frontend_step
        assert compose.count(f"{variable}: ${{{variable}:-}}") == 2
        assert f"{variable}=\n" in environment

    assert "apps/frontend\n" in frontend_step
    assert "COPY --from=builder /app/public ./public" in dockerfile


def test_site_origin_reaches_build_with_verified_production_and_local_defaults() -> None:
    dockerfile = _read("apps/frontend/Dockerfile")
    cloudbuild = _read("cloudbuild.yaml")
    compose = _read("docker-compose.yml")

    assert "ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000" in dockerfile
    assert "ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}" in dockerfile
    assert "NEXT_PUBLIC_SITE_URL=${_SITE_URL}" in cloudbuild
    assert '_SITE_URL: "https://quantum-foundry-frontend-w24p6g25aq-uc.a.run.app"' in cloudbuild
    assert "--build-arg NEXT_PUBLIC_SITE_URL" in cloudbuild
    assert compose.count("NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}") == 2


def test_article4_is_in_the_existing_public_route_smoke_set() -> None:
    smoke = _read("scripts/check-frontend-access.sh")

    for route in (
        "/series/01-platform-problem",
        "/series/02-hybrid-computing",
        "/series/04-qubit-technologies",
        "/assess",
        "/build",
        "/map",
    ):
        assert f'"{route}"' in smoke

    assert "has_iap_intercept" in smoke
    assert '"${status}" == "401" || "${status}" == "403"' in smoke


def test_article4_analytics_payload_has_no_freeform_or_record_field() -> None:
    analytics = _read("apps/frontend/src/lib/analytics.ts")
    interface = analytics.split("export interface Article4EventContext {", 1)[1].split("}", 1)[0]
    field_names = [line.strip().split("?")[0] for line in interface.splitlines() if "?:" in line]

    assert field_names == ["lesson", "mode", "level", "format"]
    for event in ("article4_lesson_open", "article4_mode_change", "article4_note_export"):
        assert f'"{event}"' in analytics
    assert "ARTICLE4_EVENTS.has(event)" in analytics
    assert "ARTICLE4_LESSONS.has(context.lesson)" in analytics
    assert "ARTICLE4_MODES.has(context.mode)" in analytics
    assert "ARTICLE4_FORMATS.has(context.format)" in analytics


def test_existing_analytics_catches_storage_and_network_failures() -> None:
    analytics = _read("apps/frontend/src/lib/analytics.ts")
    function = analytics.split("export async function trackProductEvent", 1)[1].split("const ARTICLE4_EVENTS", 1)[0]

    assert function.index("try {") < function.index("getOrCreateVisitorId()")
    assert function.index("getOrCreateVisitorId()") < function.index("await recordUsage") < function.index("} catch {")
