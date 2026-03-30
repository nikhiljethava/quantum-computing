"""
Job execution abstraction.

Provides a dispatch interface for running simulation jobs.
Local implementation runs jobs in-process (used by the worker).
TODO(gcp-deploy): implement CloudTasksJobBackend.
"""

import abc
from typing import Any


class JobBackend(abc.ABC):
    """Abstract job dispatcher. Swap implementations without changing call sites."""

    @abc.abstractmethod
    async def dispatch(self, job_id: str, job_type: str, payload: dict[str, Any]) -> None:
        """
        Dispatch a job for execution.
        For local backend: runs immediately in the same process.
        For Cloud Tasks backend: enqueues an HTTP task.
        """


class LocalJobBackend(JobBackend):
    """
    Runs jobs synchronously in-process.
    The worker service uses this when polling the DB queue.
    This class is a no-op dispatcher — the worker's polling loop IS the dispatch.
    """

    async def dispatch(self, job_id: str, job_type: str, payload: dict[str, Any]) -> None:
        # No-op: the DB-backed polling worker picks this up automatically.
        pass


def get_job_backend(backend: str = "local") -> JobBackend:
    """Factory function."""
    if backend == "local":
        return LocalJobBackend()
    # TODO(gcp-deploy): elif backend == "cloud_tasks": return CloudTasksJobBackend(...)
    raise ValueError(f"Unknown job backend: {backend!r}")
