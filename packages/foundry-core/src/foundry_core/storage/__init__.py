"""
Storage backend abstraction.

Provides a unified interface for storing and retrieving artifact files.
Local implementation writes to the filesystem. Cloud Storage can be enabled for
Cloud Run deployments without changing artifact call sites.
"""

import abc
import asyncio
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


class GcsStorageBackend(StorageBackend):
    """Persists artifacts to Google Cloud Storage."""

    def __init__(self, bucket: str, *, prefix: str = "artifacts") -> None:
        if not bucket:
            raise ValueError("GcsStorageBackend requires a non-empty bucket name.")
        self._bucket_name = bucket
        self._prefix = prefix.strip("/") if prefix else "artifacts"
        self._client = self._create_client()

    def _create_client(self):
        try:
            from google.cloud import storage  # type: ignore[import-untyped]
        except ImportError as exc:
            raise RuntimeError(
                "google-cloud-storage is required when STORAGE_BACKEND=gcs."
            ) from exc
        return storage.Client()

    def _object_name(self, filename: str) -> str:
        return f"{self._prefix}/{uuid.uuid4().hex}_{filename}"

    async def save(self, content: bytes, filename: str, content_type: str) -> str:
        object_name = self._object_name(filename)

        def _save() -> str:
            bucket = self._client.bucket(self._bucket_name)
            blob = bucket.blob(object_name)
            blob.upload_from_string(content, content_type=content_type)
            return f"gs://{self._bucket_name}/{object_name}"

        return await asyncio.to_thread(_save)

    async def load(self, uri: str) -> bytes:
        bucket_name, object_name = self._parse_uri(uri)

        def _load() -> bytes:
            bucket = self._client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            return blob.download_as_bytes()

        return await asyncio.to_thread(_load)

    async def delete(self, uri: str) -> None:
        bucket_name, object_name = self._parse_uri(uri)

        def _delete() -> None:
            bucket = self._client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            blob.delete()

        await asyncio.to_thread(_delete)

    def _parse_uri(self, uri: str) -> tuple[str, str]:
        if not uri.startswith("gs://"):
            raise ValueError(f"GcsStorageBackend cannot handle URI: {uri!r}")
        bucket_and_object = uri.removeprefix("gs://")
        bucket_name, _, object_name = bucket_and_object.partition("/")
        if not bucket_name or not object_name:
            raise ValueError(f"Invalid GCS URI: {uri!r}")
        return bucket_name, object_name


def get_storage_backend(
    backend: str = "local",
    artifact_dir: str = "./artifacts",
    gcs_bucket: str = "",
) -> StorageBackend:
    """Factory function. Reads from config in practice."""
    if backend == "local":
        return LocalStorageBackend(base_dir=artifact_dir)
    if backend == "gcs":
        return GcsStorageBackend(bucket=gcs_bucket)
    raise ValueError(f"Unknown storage backend: {backend!r}")
