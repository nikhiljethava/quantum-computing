"""API v1 router — bundles all route modules."""

from fastapi import APIRouter

from foundry_backend.api.v1.routes import (
    architectures,
    artifacts,
    assessments,
    circuits,
    health,
    jobs,
    projects,
    sessions,
    use_cases,
    usage,
)

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(use_cases.router, prefix="/use-cases", tags=["use-cases"])
router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
router.include_router(circuits.router, prefix="/circuits", tags=["circuits"])
router.include_router(artifacts.router, prefix="/artifacts", tags=["artifacts"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
router.include_router(architectures.router, prefix="/architectures", tags=["architectures"])
router.include_router(usage.router, prefix="/usage", tags=["usage"])

