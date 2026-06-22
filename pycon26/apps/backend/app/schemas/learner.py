from pydantic import BaseModel, Field, model_validator

from app.schemas.vectors import VectorSearchHit


class LearnerProfileAnalyzeRequest(BaseModel):
    current_role: str = Field(default="", max_length=160)
    target_interest: str = Field(default="", max_length=160)
    skillset: str = Field(default="", max_length=4_000)
    resume_text: str = Field(default="", max_length=12_000)

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
