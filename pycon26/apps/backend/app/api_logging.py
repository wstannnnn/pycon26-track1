import logging
import sys
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.background import BackgroundTask


logger = logging.getLogger("job_skills.api")
MAX_RESPONSE_LOG_BYTES = 4_096
logger.setLevel(logging.INFO)
logger.propagate = False

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logger.addHandler(handler)


async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    start_time = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.exception(
            "api_request_failed method=%s path=%s duration_ms=%.2f",
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk

    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "api_request method=%s path=%s status_code=%s duration_ms=%.2f response_body=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        format_response_body(response_body),
    )
    return Response(
        content=response_body,
        status_code=response.status_code,
        headers=dict(response.headers),
        media_type=response.media_type,
        background=response.background if isinstance(response.background, BackgroundTask) else None,
    )


def format_response_body(response_body: bytes) -> str:
    if len(response_body) > MAX_RESPONSE_LOG_BYTES:
        response_body = response_body[:MAX_RESPONSE_LOG_BYTES] + b"..."
    return response_body.decode("utf-8", errors="replace")
