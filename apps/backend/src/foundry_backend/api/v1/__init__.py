"""API v1 router — bundles all route modules."""

from fastapi import APIRouter

from foundry_backend.api.v1.routes import architectures, assessments, health, jobs, use_cases

router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(use_cases.router, prefix="/use-cases", tags=["use-cases"])
router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
router.include_router(architectures.router, prefix="/architectures", tags=["architectures"])
