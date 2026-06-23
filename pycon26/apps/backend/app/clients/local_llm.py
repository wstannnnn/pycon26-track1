import json
import logging
from typing import Any

import httpx

from app.config import settings
from app.schemas.learner import LearnerRecommendation, ResumeProfileExtraction
from app.schemas.vectors import VectorSearchHit


logger = logging.getLogger("job_skills.llm")
MAX_PROFILE_CHARS = 3_000
MAX_COMPRESSED_ROLES = 3
MAX_EVIDENCE_TEXT_CHARS = 350
MAX_EVIDENCE_LIST_ITEMS = 6


class LocalLlmClient:
    def __init__(
        self,
        base_url: str = settings.local_llm_url,
        model: str = settings.local_llm_model,
        provider: str = settings.local_llm_provider,
        enabled: bool = settings.local_llm_enabled,
        transport: httpx.AsyncBaseTransport | None = None,
        timeout: float = 120.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.provider = provider
        self.enabled = enabled
        self.transport = transport
        self.timeout = timeout

    async def recommend(
        self,
        profile_text: str,
        matches: list[VectorSearchHit],
    ) -> LearnerRecommendation | None:
        if not self.enabled:
            return None

        prompt = build_recommendation_prompt(profile_text, matches)
        if self.provider == "ollama":
            return await self._recommend_with_ollama(prompt)

        return await self._recommend_with_openai_compatible(prompt)

    async def extract_resume_profile(
        self,
        compressed_resume_text: str,
    ) -> ResumeProfileExtraction | None:
        if not self.enabled:
            return None

        prompt = build_resume_profile_prompt(compressed_resume_text)
        if self.provider == "ollama":
            payload = await self._generate_json_with_ollama(prompt)
        else:
            payload = await self._generate_json_with_openai_compatible(prompt)

        return resume_profile_from_json(payload)

    async def _recommend_with_ollama(self, prompt: str) -> LearnerRecommendation:
        return recommendation_from_json(await self._generate_json_with_ollama(prompt))

    async def _recommend_with_openai_compatible(self, prompt: str) -> LearnerRecommendation:
        return recommendation_from_json(
            await self._generate_json_with_openai_compatible(prompt)
        )

    async def _generate_json_with_ollama(self, prompt: str) -> dict[str, Any]:
        async with httpx.AsyncClient(
            base_url=self.base_url,
            transport=self.transport,
            timeout=self.timeout,
        ) as client:
            response = await client.post(
                "/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.2},
                },
            )
            raise_for_status_with_body(response)

        raw_response = response.json().get("response", "{}")
        logger.info(
            "local_llm_response provider=ollama status_code=%s chars=%s",
            response.status_code,
            len(raw_response),
        )
        return json.loads(raw_response)

    async def _generate_json_with_openai_compatible(self, prompt: str) -> dict[str, Any]:
        async with httpx.AsyncClient(
            base_url=self.base_url,
            transport=self.transport,
            timeout=self.timeout,
        ) as client:
            response = await client.post(
                "/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Return only valid JSON. Do not wrap it in markdown.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1800,
                },
            )
            raise_for_status_with_body(response)

        payload = response.json()
        message = payload["choices"][0]["message"]
        raw_response = message.get("content") or message.get("reasoning_content") or ""
        logger.info(
            "local_llm_response provider=openai-compatible status_code=%s chars=%s finish_reason=%s",
            response.status_code,
            len(raw_response),
            payload["choices"][0].get("finish_reason", ""),
        )
        parsed_response = json.loads(extract_json_object(raw_response))
        return parsed_response


def build_recommendation_prompt(profile_text: str, matches: list[VectorSearchHit]) -> str:
    compressed_evidence = compress_evidence(matches)
    return (
        "You are a career pathway assistant. Return a single JSON object only. "
        "Do not include markdown, reasoning, comments, or extra text. "
        "The JSON object must use exactly these keys: next_roles, priority_skills, "
        "actions_today, explanation. Each of next_roles, priority_skills, and actions_today "
        "must be an array of strings. Make actions_today concrete tasks the learner can start "
        "today in 30 to 90 minutes. Each action should begin with a strong verb, name a skill "
        "or role artifact, and include a measurable output such as one query, one dashboard, "
        "one portfolio note, one outreach message, or one practice exercise. Avoid vague actions "
        "like learn more, research, or improve skills. Use the learner profile and similarity "
        "evidence below.\n\n"
        f"Learner profile:\n{truncate_text(profile_text, MAX_PROFILE_CHARS)}\n\n"
        f"Compressed similarity evidence:\n{json.dumps(compressed_evidence, ensure_ascii=True)}"
    )


def build_resume_profile_prompt(compressed_resume_text: str) -> str:
    return (
        "You extract structured profile fields from a resume. Return one JSON object only. "
        "Do not include markdown, reasoning, comments, or extra text. "
        "Use exactly these keys: current_role, skillset, summary. "
        "current_role must be the most recent or most likely job role. "
        "skillset must be a concise comma-separated list of skills, tools, methods, and domains. "
        "summary must be one short sentence grounded in the resume.\n\n"
        f"Compressed resume text:\n{truncate_text(compressed_resume_text, MAX_PROFILE_CHARS)}"
    )


def raise_for_status_with_body(response: httpx.Response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError:
        logger.error(
            "local_llm_http_error status_code=%s response_body=%s",
            response.status_code,
            truncate_text(response.text, 1_000),
        )
        raise


def compress_evidence(matches: list[VectorSearchHit]) -> list[dict[str, Any]]:
    roles: dict[str, dict[str, Any]] = {}
    for match in sorted(matches, key=lambda item: item.score, reverse=True):
        payload = match.payload
        role = first_text(payload.get("roles")) or str(payload.get("role") or "").strip()
        if not role:
            role = str(payload.get("skill") or payload.get("task") or match.id).strip()

        role_key = role.casefold()
        summary = roles.setdefault(
            role_key,
            {
                "role": role,
                "best_score": match.score,
                "sectors": [],
                "tracks": [],
                "skills": [],
                "tasks": [],
                "descriptions": [],
                "proficiency_levels": [],
                "record_types": [],
            },
        )
        summary["best_score"] = max(float(summary["best_score"]), match.score)
        append_unique(summary["sectors"], payload.get("sector"))
        append_unique(summary["tracks"], payload.get("track"))
        extend_unique(summary["skills"], payload.get("skills"))
        append_unique(summary["skills"], payload.get("skill"))
        extend_unique(summary["tasks"], payload.get("tasks"))
        append_unique(summary["tasks"], payload.get("task"))
        extend_unique(summary["descriptions"], payload.get("descriptions"))
        append_unique(summary["descriptions"], payload.get("description"))
        append_unique(summary["descriptions"], first_text(payload.get("documents")))
        append_unique(summary["proficiency_levels"], payload.get("proficiency_level"))
        extend_unique(summary["record_types"], payload.get("record_types"))
        append_unique(summary["record_types"], payload.get("record_type"))

    compressed = sorted(roles.values(), key=lambda item: float(item["best_score"]), reverse=True)
    return [trim_summary(summary) for summary in compressed[:MAX_COMPRESSED_ROLES]]


def trim_summary(summary: dict[str, Any]) -> dict[str, Any]:
    trimmed = {
        "role": truncate_text(summary["role"], 120),
        "best_score": round(float(summary["best_score"]), 4),
        "sectors": truncate_list(summary["sectors"]),
        "tracks": truncate_list(summary["tracks"]),
        "skills": truncate_list(summary["skills"]),
        "tasks": truncate_list(summary["tasks"]),
        "descriptions": truncate_list(summary["descriptions"])[:3],
        "proficiency_levels": truncate_list(summary["proficiency_levels"]),
        "record_types": truncate_list(summary["record_types"]),
    }
    return {key: value for key, value in trimmed.items() if value}


def truncate_text(value: object, max_chars: int) -> str:
    text = str(value or "").strip()
    if len(text) <= max_chars:
        return text
    return f"{text[:max_chars].rstrip()}..."


def truncate_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [truncate_text(item, MAX_EVIDENCE_TEXT_CHARS) for item in value[:MAX_EVIDENCE_LIST_ITEMS]]


def append_unique(values: list[str], value: Any) -> None:
    text = truncate_text(value, MAX_EVIDENCE_TEXT_CHARS)
    if text and text.casefold() not in {item.casefold() for item in values}:
        values.append(text)


def extend_unique(values: list[str], value: Any) -> None:
    if not isinstance(value, list):
        return
    for item in value:
        append_unique(values, item)


def first_text(value: Any) -> str:
    if isinstance(value, list) and value:
        return truncate_text(value[0], MAX_EVIDENCE_TEXT_CHARS)
    return ""


def recommendation_from_json(payload: dict[str, Any]) -> LearnerRecommendation:
    return LearnerRecommendation(
        next_roles=coerce_string_list(payload.get("next_roles")),
        priority_skills=coerce_string_list(payload.get("priority_skills")),
        actions_today=normalize_actions_today(coerce_string_list(payload.get("actions_today"))),
        explanation=str(payload.get("explanation", "")).strip()
        or "Generated by a local LLM using profile text and similarity evidence.",
    )


def resume_profile_from_json(payload: dict[str, Any]) -> ResumeProfileExtraction:
    skillset_value = payload.get("skillset")
    if isinstance(skillset_value, list):
        skillset = ", ".join(coerce_string_list(skillset_value))
    else:
        skillset = str(skillset_value or "").strip()

    return ResumeProfileExtraction(
        current_role=str(payload.get("current_role", "")).strip(),
        skillset=skillset,
        summary=str(payload.get("summary", "")).strip(),
    )


def coerce_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def normalize_actions_today(actions: list[str]) -> list[str]:
    normalized = []
    for action in actions:
        text = action.strip()
        if not text:
            continue
        if has_timebox(text) or has_measurable_output(text):
            normalized.append(text)
            continue
        normalized.append(f"Spend 30 minutes today to {lower_first(text)} and save one note or artifact.")
    return normalized


def has_timebox(value: str) -> bool:
    lowered = value.lower()
    return any(token in lowered for token in ("minute", "hour", "today", "this afternoon"))


def has_measurable_output(value: str) -> bool:
    lowered = value.lower()
    outputs = (
        "one ",
        "1 ",
        "draft",
        "dashboard",
        "query",
        "portfolio",
        "exercise",
        "message",
        "artifact",
        "checklist",
        "summary",
        "note",
    )
    return any(output in lowered for output in outputs)


def lower_first(value: str) -> str:
    if not value:
        return value
    return f"{value[0].lower()}{value[1:]}"


def strip_json_fences(value: str) -> str:
    stripped = value.strip()
    if stripped.startswith("```json"):
        return stripped.removeprefix("```json").removesuffix("```").strip()
    if stripped.startswith("```"):
        return stripped.removeprefix("```").removesuffix("```").strip()
    return stripped


def extract_json_object(value: str) -> str:
    stripped = strip_json_fences(value)
    if stripped.startswith("{") and stripped.endswith("}"):
        return stripped

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Local LLM response did not contain a JSON object.")
    return stripped[start : end + 1]


local_llm_client = LocalLlmClient()
