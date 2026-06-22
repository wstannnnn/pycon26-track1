from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.clients.vector_db import VectorDbClient
from app.dependencies import get_role_repository, get_vector_db_client
from app.repositories.roles import RoleRepository
from app.schemas.roles import CareerPathwayRequest, CareerPathwayResponse, RoleOut, role_to_response
from app.services.career_pathway import CareerPathwayDataUnavailableError, build_career_pathway

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
async def list_roles(
    repository: Annotated[RoleRepository, Depends(get_role_repository)],
) -> list[RoleOut]:
    roles = await repository.list_roles()
    return [role_to_response(role) for role in roles]


@router.post("/pathway", response_model=CareerPathwayResponse)
async def create_career_pathway(
    payload: CareerPathwayRequest,
    vector_db: Annotated[VectorDbClient, Depends(get_vector_db_client)],
) -> CareerPathwayResponse:
    try:
        return await run_in_threadpool(build_career_pathway, payload, vector_db)
    except CareerPathwayDataUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No indexed ChromaDB role evidence found for this pathway.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Career pathway generation failed.",
        ) from exc
