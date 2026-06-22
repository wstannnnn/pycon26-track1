import logging

import httpx
from starlette.concurrency import run_in_threadpool

from app.clients.local_llm import LocalLlmClient, local_llm_client
from app.clients.vector_db import VectorDbClient, vector_db_client
from app.schemas.learner import LearnerProfileAnalyzeRequest, LearnerRecommendation
from app.schemas.vectors import VectorSearchHit


logger = logging.getLogger("job_skills.llm")


class LocalLlmUnavailableError(Exception):
    pass


def normalize_profile_text(payload: LearnerProfileAnalyzeRequest) -> str:
    parts = [
        f"Current role: {payload.current_role.strip()}",
        f"Target interest: {payload.target_interest.strip()}",
        f"Skillset: {payload.skillset.strip()}",
        f"Resume: {payload.resume_text.strip()}",
    ]
    return "\n".join(part for part in parts if not part.endswith(": "))


async def similarity_search(
    text: str,
    role_query: str = "",
    client: VectorDbClient = vector_db_client,
) -> list[VectorSearchHit]:
    return await run_in_threadpool(search_learner_evidence, text, role_query, client)


def search_learner_evidence(
    text: str,
    role_query: str,
    client: VectorDbClient,
) -> list[VectorSearchHit]:
    role_matches = client.find_role_records(role_query, limit=3) if role_query.strip() else []
    if role_matches:
        role = clean(role_matches[0].payload.get("role"))
        supporting_matches = client.search_text(text, limit=8, where={"role": role})
        return merge_matches(role_matches, supporting_matches, limit=8)

    job_role_matches = client.search_text(
        text,
        limit=3,
        where={"record_type": "job_role"},
    )
    if not job_role_matches:
        return client.search_text(text, limit=8)

    role = clean(job_role_matches[0].payload.get("role"))
    supporting_matches = client.search_text(text, limit=8, where={"role": role})
    return merge_matches(job_role_matches, supporting_matches, limit=8)


def merge_matches(*match_groups: list[VectorSearchHit], limit: int) -> list[VectorSearchHit]:
    merged: dict[str, VectorSearchHit] = {}
    for matches in match_groups:
        for match in matches:
            existing = merged.get(match.id)
            if existing is None or match.score > existing.score:
                merged[match.id] = match

    return sorted(merged.values(), key=lambda match: match.score, reverse=True)[:limit]


async def generate_recommendation(
    profile_text: str,
    matches: list[VectorSearchHit],
    client: LocalLlmClient = local_llm_client,
) -> tuple[LearnerRecommendation, str]:
    try:
        recommendation = await client.recommend(profile_text=profile_text, matches=matches)
    except (httpx.HTTPError, ValueError) as exc:
        logger.exception(
            "local_llm_failed provider=%s base_url=%s model=%s error_type=%s error=%s",
            getattr(client, "provider", "unknown"),
            getattr(client, "base_url", "unknown"),
            getattr(client, "model", "unknown"),
            type(exc).__name__,
            str(exc),
        )
        raise LocalLlmUnavailableError("Local LLM failed to generate a valid response.") from exc

    if recommendation is None:
        raise LocalLlmUnavailableError("Local LLM is disabled.")

    return recommendation, "local"


def clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()
