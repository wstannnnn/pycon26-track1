from app.clients.vector_db import VectorDbClient
from app.schemas.roles import (
    CareerPathwayEvidence,
    CareerPathwayLevel,
    CareerPathwayRequest,
    CareerPathwayResponse,
)
from app.schemas.vectors import VectorSearchHit


class CareerPathwayDataUnavailableError(Exception):
    pass


LEVEL_TEMPLATES = [
    (
        "Junior",
        "Build core task confidence, vocabulary, and evidence through guided work.",
        ["Learn role fundamentals", "Document small projects", "Ask for structured feedback"],
    ),
    (
        "Associate",
        "Handle standard work independently and show consistent delivery.",
        ["Own repeatable tasks", "Improve quality and speed", "Track measurable outcomes"],
    ),
    (
        "Specialist",
        "Develop deeper domain judgement and solve less-defined problems.",
        ["Build a focused portfolio", "Mentor newer learners", "Map skills to business needs"],
    ),
    (
        "Senior",
        "Lead complex work, influence decisions, and raise team standards.",
        ["Lead cross-functional work", "Explain trade-offs clearly", "Coach peers"],
    ),
    (
        "Lead",
        "Coordinate people, priorities, and delivery across a larger scope.",
        ["Set delivery practices", "Guide role-to-skill planning", "Translate goals into roadmaps"],
    ),
    (
        "Manager",
        "Manage outcomes through people, planning, and capability building.",
        ["Run team planning", "Review performance signals", "Create development plans"],
    ),
    (
        "Senior Manager",
        "Scale practices across teams and connect execution to strategy.",
        ["Align teams around metrics", "Prioritise reskilling investments", "Manage senior stakeholders"],
    ),
    (
        "Director",
        "Own a function, budget, and multi-quarter workforce direction.",
        ["Set functional strategy", "Sponsor transformation work", "Build leadership bench strength"],
    ),
    (
        "Head of Function",
        "Shape organisation-wide capability and long-term career pathways.",
        ["Define capability architecture", "Partner with executive leaders", "Govern portfolio outcomes"],
    ),
    (
        "Top Management",
        "Set enterprise direction, talent strategy, and strategic bets.",
        ["Make executive trade-offs", "Steer workforce transformation", "Communicate strategic intent"],
    ),
]


def build_career_pathway(
    payload: CareerPathwayRequest,
    vector_db: VectorDbClient,
) -> CareerPathwayResponse:
    role_query = payload.target_interest.strip() or payload.current_role.strip()
    matches = vector_db.find_role_records(role_query, limit=12)
    if not matches:
        matches = vector_db.search_text(
            build_search_query(payload),
            limit=12,
            where={"record_type": "job_role"},
        )
    evidence = extract_role_evidence(matches)
    if not evidence:
        raise CareerPathwayDataUnavailableError("No ChromaDB role evidence found.")

    focus_role = evidence[0].role
    levels = [
        CareerPathwayLevel(
            level=index,
            stage=stage,
            title=build_title(stage, focus_role),
            focus=build_focus(focus, evidence[0]),
            actions=actions,
        )
        for index, (stage, focus, actions) in enumerate(LEVEL_TEMPLATES, start=1)
    ]

    return CareerPathwayResponse(
        current_role=payload.current_role,
        target_interest=payload.target_interest,
        pathway_name=f"{focus_role} pathway from junior to top management",
        evidence=evidence,
        levels=levels,
    )


def build_search_query(payload: CareerPathwayRequest) -> str:
    parts = [
        payload.target_interest.strip(),
        payload.current_role.strip(),
        "job role skills tasks sector career pathway progression management",
    ]
    return " ".join(part for part in parts if part)


def extract_role_evidence(matches: list[VectorSearchHit]) -> list[CareerPathwayEvidence]:
    evidence_by_role: dict[str, CareerPathwayEvidence] = {}
    for match in matches:
        role = clean(match.payload.get("role"))
        if not role or role in evidence_by_role:
            continue

        evidence_by_role[role] = CareerPathwayEvidence(
            role=role,
            sector=clean(match.payload.get("sector")),
            track=clean(match.payload.get("track")),
            description=clean(match.payload.get("description"))
            or clean(match.payload.get("task"))
            or clean(match.payload.get("document")),
            source=clean(match.payload.get("source")),
            score=match.score,
        )

    return list(evidence_by_role.values())


def build_focus(base_focus: str, evidence: CareerPathwayEvidence) -> str:
    context = []
    if evidence.sector:
        context.append(f"sector: {evidence.sector}")
    if evidence.track:
        context.append(f"track: {evidence.track}")
    if not context:
        return base_focus

    return f"{base_focus} Relevant context: {', '.join(context)}."


def build_title(stage: str, focus_role: str) -> str:
    if stage == "Top Management":
        return f"Executive leader for {focus_role}"
    if stage == "Head of Function":
        return f"Head of {focus_role}"
    if stage in {"Manager", "Senior Manager", "Director"}:
        return f"{focus_role} {stage}"

    return f"{stage} {focus_role}"


def clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()
