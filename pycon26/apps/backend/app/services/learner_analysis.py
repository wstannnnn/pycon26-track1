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


class TargetInterestNotFoundError(Exception):
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
    job_skill_matches = search_job_skill_evidence(text, role_query, client)
    unique_skill_matches = client.search_unique_skills_text(text, limit=5)
    return merge_matches(job_skill_matches, unique_skill_matches, limit=10)


def search_job_skill_evidence(
    text: str,
    role_query: str,
    client: VectorDbClient,
) -> list[VectorSearchHit]:
    role_matches = client.find_role_records(role_query, limit=3, auto_index=False)
    if not role_matches:
        raise TargetInterestNotFoundError(f"No job role found for target interest: {role_query}")

    role = clean(role_matches[0].payload.get("role"))
    supporting_matches = client.search_text(
        text,
        limit=8,
        where={"role": role},
        auto_index=False,
    )
    return merge_matches(role_matches, supporting_matches, limit=8)


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
    except httpx.HTTPError as exc:
        logger.exception(
            "local_llm_failed provider=%s base_url=%s model=%s error_type=%s error=%s",
            getattr(client, "provider", "unknown"),
            getattr(client, "base_url", "unknown"),
            getattr(client, "model", "unknown"),
            type(exc).__name__,
            str(exc),
        )
        raise LocalLlmUnavailableError("Local LLM failed to generate a valid response.") from exc
    except ValueError as exc:
        logger.warning(
            "local_llm_invalid_json provider=%s model=%s error_type=%s error=%s",
            getattr(client, "provider", "unknown"),
            getattr(client, "model", "unknown"),
            type(exc).__name__,
            str(exc),
        )
        return build_evidence_fallback_recommendation(matches), "evidence-fallback"

    if recommendation is None:
        raise LocalLlmUnavailableError("Local LLM is disabled.")

    return recommendation, "local"


def build_evidence_fallback_recommendation(matches: list[VectorSearchHit]) -> LearnerRecommendation:
    roles = unique_values(value for match in matches for value in payload_values(match.payload, "role", "roles"))
    skills = unique_values(
        value for match in matches for value in payload_values(match.payload, "skill", "skills")
    )
    priority_skills = skills[:5] or ["Review the top matched skill evidence"]
    next_roles = roles[:3] or ["Explore roles linked to the matched skills"]
    actions_today = [
        f"Spend 30 minutes today creating one practice note for {skill}."
        for skill in priority_skills[:3]
    ]

    return LearnerRecommendation(
        next_roles=next_roles,
        priority_skills=priority_skills,
        actions_today=actions_today,
        explanation=(
            "Generated from retrieved SkillsFuture evidence because the local LLM returned "
            "invalid JSON."
        ),
    )


def payload_values(payload: dict[str, object], singular_key: str, plural_key: str) -> list[str]:
    values: list[str] = []
    singular_value = clean(payload.get(singular_key))
    if singular_value:
        values.append(singular_value)

    plural_value = payload.get(plural_key)
    if isinstance(plural_value, list):
        values.extend(clean(item) for item in plural_value if clean(item))

    return values


def unique_values(values: object) -> list[str]:
    unique: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = clean(value)
        key = text.casefold()
        if not text or key in seen:
            continue
        seen.add(key)
        unique.append(text)
    return unique


def clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()
