"""
Job execution abstraction.

Provides a dispatch interface for simulation and export jobs.
Local development keeps a DB-backed poller. Cloud Run deployments can switch to
Cloud Tasks HTTP dispatch without changing route handlers.
"""

import abc
import asyncio
import json
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


class CloudTasksJobBackend(JobBackend):
    """Dispatches job rows to a Cloud Run worker over Cloud Tasks."""

    def __init__(
        self,
        *,
        project_id: str,
        location: str,
        queue: str,
        worker_url: str,
        service_account_email: str = "",
        audience: str = "",
    ) -> None:
        if not project_id or not location or not queue or not worker_url:
            raise ValueError(
                "CloudTasksJobBackend requires project_id, location, queue, and worker_url."
            )
        self._project_id = project_id
        self._location = location
        self._queue = queue
        self._worker_url = worker_url.rstrip("/")
        self._service_account_email = service_account_email
        self._audience = audience
        self._client = self._create_client()

    def _create_client(self):
        try:
            from google.cloud import tasks_v2  # type: ignore[import-untyped]
        except ImportError as exc:
            raise RuntimeError(
                "google-cloud-tasks is required when JOB_BACKEND=cloud_tasks."
            ) from exc
        return tasks_v2.CloudTasksClient()

    async def dispatch(self, job_id: str, job_type: str, payload: dict[str, Any]) -> None:
        def _dispatch() -> None:
            from google.cloud import tasks_v2  # type: ignore[import-untyped]

            parent = self._client.queue_path(self._project_id, self._location, self._queue)
            request_body = json.dumps(
                {
                    "job_id": job_id,
                    "job_type": job_type,
                    "payload": payload,
                }
            ).encode("utf-8")
            task: dict[str, Any] = {
                "http_request": {
                    "http_method": tasks_v2.HttpMethod.POST,
                    "url": f"{self._worker_url}/tasks/jobs/{job_id}",
                    "headers": {"Content-Type": "application/json"},
                    "body": request_body,
                }
            }
            if self._service_account_email:
                token: dict[str, Any] = {"service_account_email": self._service_account_email}
                if self._audience:
                    token["audience"] = self._audience
                task["http_request"]["oidc_token"] = token
            self._client.create_task(parent=parent, task=task)

        await asyncio.to_thread(_dispatch)


def get_job_backend(
    backend: str = "local",
    *,
    project_id: str = "",
    location: str = "",
    queue: str = "",
    worker_url: str = "",
    service_account_email: str = "",
    audience: str = "",
) -> JobBackend:
    """Factory function."""
    if backend == "local":
        return LocalJobBackend()
    if backend == "cloud_tasks":
        return CloudTasksJobBackend(
            project_id=project_id,
            location=location,
            queue=queue,
            worker_url=worker_url,
            service_account_email=service_account_email,
            audience=audience,
        )
    raise ValueError(f"Unknown job backend: {backend!r}")
