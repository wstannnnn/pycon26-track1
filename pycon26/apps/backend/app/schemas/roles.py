from pydantic import BaseModel, Field

from app.models import Role


class SkillOut(BaseModel):
    name: str
    category: str
    importance: int


class RoleOut(BaseModel):
    id: int
    title: str
    description: str
    skills: list[SkillOut] = Field(default_factory=list)


class CareerPathwayRequest(BaseModel):
    current_role: str = Field(default="", max_length=120)
    target_interest: str = Field(default="", max_length=120)


class CareerPathwayLevel(BaseModel):
    level: int
    stage: str
    title: str
    focus: str
    actions: list[str]


class CareerPathwayEvidence(BaseModel):
    role: str
    sector: str = ""
    track: str = ""
    description: str = ""
    score: float


class CareerPathwayResponse(BaseModel):
    current_role: str
    target_interest: str
    pathway_name: str
    evidence: list[CareerPathwayEvidence]
    levels: list[CareerPathwayLevel]


def role_to_response(role: Role) -> RoleOut:
    return RoleOut(
        id=role.id,
        title=role.title,
        description=role.description,
        skills=[
            SkillOut(name=skill.name, category=skill.category, importance=skill.importance)
            for skill in role.skills
        ],
    )
