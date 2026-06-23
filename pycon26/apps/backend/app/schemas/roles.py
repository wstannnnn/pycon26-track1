from pydantic import BaseModel, Field, field_validator

from app.models import Role
from app.schemas.learner import is_target_interest_character


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
    current_role: str = Field(min_length=1, max_length=120)
    target_interest: str = Field(min_length=1, max_length=120)

    @field_validator("target_interest")
    @classmethod
    def validate_target_interest(cls, value: str) -> str:
        target_interest = value.strip()
        if not any(character.isalpha() for character in target_interest):
            raise ValueError("Target interest must include a role or skill name.")
        if any(not is_target_interest_character(character) for character in target_interest):
            raise ValueError("Target interest contains unsupported characters.")
        return target_interest


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
    source: str = ""
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
