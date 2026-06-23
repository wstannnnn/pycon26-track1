from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.vectors import VectorSearchHit


class LearnerProfileAnalyzeRequest(BaseModel):
    current_role: str = Field(default="", max_length=160)
    target_interest: str = Field(max_length=160)
    skillset: str = Field(default="", max_length=4_000)
    resume_text: str = Field(default="", max_length=12_000)

    @field_validator("target_interest")
    @classmethod
    def validate_target_interest(cls, value: str) -> str:
        target_interest = value.strip()
        if len(target_interest) < 3:
            raise ValueError("Target interest must be at least 3 characters.")
        if not any(character.isalpha() for character in target_interest):
            raise ValueError("Target interest must include a role or skill name.")
        if any(not is_target_interest_character(character) for character in target_interest):
            raise ValueError("Target interest contains unsupported characters.")
        return target_interest

    @model_validator(mode="after")
    def require_skillset_or_resume(self) -> "LearnerProfileAnalyzeRequest":
        if not self.skillset.strip() and not self.resume_text.strip():
            raise ValueError("Provide a skillset or resume text for analysis.")
        return self


class LearnerRecommendation(BaseModel):
    next_roles: list[str]
    priority_skills: list[str]
    actions_today: list[str]
    explanation: str


class ResumeProfileExtraction(BaseModel):
    current_role: str = ""
    skillset: str = ""
    summary: str = ""


class ResumeUploadResponse(BaseModel):
    current_role: str
    skillset: str
    compressed_resume_text: str
    raw_text_chars: int
    llm_provider: str = "local"


class LearnerProfileAnalyzeResponse(BaseModel):
    normalized_text: str
    similar_matches: list[VectorSearchHit]
    recommendation: LearnerRecommendation
    llm_provider: str = "local"


def is_target_interest_character(character: str) -> bool:
    return character.isalnum() or character.isspace() or character in " +#&/.,()-'"
