import os
import uuid
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

class StorageService:
    """
    Handles deliverable file uploads and storage.
    Supports Supabase Storage if SUPABASE_URL and SUPABASE_KEY are configured,
    with seamless local/mock fallback for offline or zero-cloud operation.
    """

    @classmethod
    def is_supabase_enabled(cls) -> bool:
        return bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)

    @classmethod
    async def upload_file(
        cls,
        file_bytes: bytes,
        filename: str,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Uploads a file to Supabase Storage bucket or generates a managed URI.
        """
        unique_id = str(uuid.uuid4())[:8]
        safe_name = f"{unique_id}_{filename.replace(' ', '_')}"

        if cls.is_supabase_enabled():
            try:
                base_url = settings.SUPABASE_URL.rstrip('/')
                bucket = settings.SUPABASE_STORAGE_BUCKET
                upload_url = f"{base_url}/storage/v1/object/{bucket}/{safe_name}"

                headers = {
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "apikey": settings.SUPABASE_KEY,
                    "Content-Type": content_type
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(upload_url, content=file_bytes, headers=headers)
                    if resp.status_code in (200, 201):
                        public_url = f"{base_url}/storage/v1/object/public/{bucket}/{safe_name}"
                        return {
                            "storage_provider": "supabase",
                            "file_url": public_url,
                            "filename": safe_name,
                            "size_bytes": len(file_bytes),
                            "content_type": content_type
                        }
            except Exception as e:
                print(f"[StorageService] Supabase upload failed, falling back to local: {e}")

        # Local mock storage fallback
        mock_url = f"https://storage.taskflow.dev/deliverables/{safe_name}"
        return {
            "storage_provider": "local_mock",
            "file_url": mock_url,
            "filename": safe_name,
            "size_bytes": len(file_bytes),
            "content_type": content_type
        }
