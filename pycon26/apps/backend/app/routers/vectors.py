from fastapi import APIRouter, HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.clients.vector_db import vector_db_client
from app.schemas.vectors import VectorSearchRequest, VectorSearchResponse, VectorUpsertRequest

router = APIRouter(prefix="/vectors", tags=["vectors"])


@router.post("/upsert")
async def upsert_vectors(payload: VectorUpsertRequest) -> dict[str, object]:
    try:
        return await run_in_threadpool(vector_db_client.upsert_points, payload.points)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vector database upsert failed.",
        ) from exc


@router.post("/search", response_model=VectorSearchResponse)
async def search_vectors(payload: VectorSearchRequest) -> VectorSearchResponse:
    try:
        matches = await run_in_threadpool(
            vector_db_client.search_text,
            payload.query,
            payload.limit,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vector database search failed.",
        ) from exc

    return VectorSearchResponse(matches=matches)


@router.post("/index")
async def index_vectors() -> dict[str, object]:
    try:
        indexed = await run_in_threadpool(vector_db_client.index_data_dir, vector_db_client.data_dir)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vector database indexing failed.",
        ) from exc

    return {"status": "ok", "result": {"indexed": indexed}}
