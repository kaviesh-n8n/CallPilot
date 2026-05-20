from unittest.mock import patch

from api.enums import StorageBackend
from api.services.storage import get_storage_for_backend


def test_s3_compatible_endpoint_is_forwarded():
    with patch("api.services.storage.S3_BUCKET", "callpilot-media"):
        with patch("api.services.storage.S3_REGION", "auto"):
            with patch(
                "api.services.storage.S3_ENDPOINT_URL",
                "https://acct.r2.cloudflarestorage.com",
            ):
                with patch("api.services.storage.S3FileSystem") as mock_fs:
                    get_storage_for_backend(StorageBackend.S3.value)
                    mock_fs.assert_called_once_with(
                        "callpilot-media",
                        "auto",
                        endpoint_url="https://acct.r2.cloudflarestorage.com",
                    )
