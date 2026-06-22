from typing import Any

from pydantic import BaseModel, Field


class VectorPoint(BaseModel):
    id: str | int
    vector: list[float] | None = None
    document: str = ""
    payload: dict[str, Any] = Field(default_factory=dict)


class VectorUpsertRequest(BaseModel):
    points: list[VectorPoint] = Field(min_length=1)


class VectorUpsertResponse(BaseModel):
    status: str
    result: dict[str, Any] = Field(default_factory=dict)


class VectorSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=5, ge=1, le=50)


class VectorSearchHit(BaseModel):
    id: str
    score: float
    payload: dict[str, Any] = Field(default_factory=dict)


class VectorSearchResponse(BaseModel):
    matches: list[VectorSearchHit]
