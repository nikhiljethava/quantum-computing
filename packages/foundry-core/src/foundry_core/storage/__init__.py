"""
Storage backend abstraction.

Provides a unified interface for storing and retrieving artifact files.
Local implementation writes to the filesystem.
TODO(gcp-deploy): implement GcsStorageBackend using google-cloud-storage.
"""

import abc
import os
import uuid
from pathlib import Path


class StorageBackend(abc.ABC):
    """Abstract storage backend. Swap implementations without changing call sites."""

    @abc.abstractmethod
    async def save(self, content: bytes, filename: str, content_type: str) -> str:
        """
        Persist content and return a storage URI.
        URI format:
          - Local: "local://<absolute_path>"
          - GCS:   "gs://<bucket>/<object>"
        """

    @abc.abstractmethod
    async def load(self, uri: str) -> bytes:
        """Retrieve content by URI."""

    @abc.abstractmethod
    async def delete(self, uri: str) -> None:
        """Delete content by URI."""


class LocalStorageBackend(StorageBackend):
    """Writes artifacts to a local directory. Suitable for development."""

    def __init__(self, base_dir: str) -> None:
        self._base = Path(base_dir)
        self._base.mkdir(parents=True, exist_ok=True)

    async def save(self, content: bytes, filename: str, content_type: str) -> str:
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        dest = self._base / unique_name
        dest.write_bytes(content)
        return f"local://{dest.resolve()}"

    async def load(self, uri: str) -> bytes:
        path = self._uri_to_path(uri)
        return path.read_bytes()

    async def delete(self, uri: str) -> None:
        path = self._uri_to_path(uri)
        path.unlink(missing_ok=True)

    def _uri_to_path(self, uri: str) -> Path:
        if not uri.startswith("local://"):
            raise ValueError(f"LocalStorageBackend cannot handle URI: {uri!r}")
        return Path(uri.removeprefix("local://"))


def get_storage_backend(backend: str = "local", artifact_dir: str = "./artifacts") -> StorageBackend:
    """Factory function. Reads from config in practice."""
    if backend == "local":
        return LocalStorageBackend(base_dir=artifact_dir)
    # TODO(gcp-deploy): elif backend == "gcs": return GcsStorageBackend(bucket=gcs_bucket)
    raise ValueError(f"Unknown storage backend: {backend!r}")
