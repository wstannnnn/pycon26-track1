from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.learner import (
    LearnerProfileAnalyzeRequest,
    LearnerProfileAnalyzeResponse,
    ResumeUploadResponse,
)
from app.services.learner_analysis import (
    LocalLlmUnavailableError,
    generate_recommendation,
    normalize_profile_text,
    similarity_search,
)
from app.services.resume_profile import (
    ResumePdfError,
    ResumeProfileExtractionError,
    extract_resume_profile,
)

router = APIRouter(prefix="/learner", tags=["learner"])


@router.post("/resume/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
) -> ResumeUploadResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a PDF resume.",
        )

    pdf_bytes = await file.read()
    try:
        profile, compressed_resume_text, raw_text_chars = await extract_resume_profile(pdf_bytes)
    except ResumePdfError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ResumeProfileExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Local LLM failed to extract resume profile.",
        ) from exc

    return ResumeUploadResponse(
        current_role=profile.current_role,
        skillset=profile.skillset,
        compressed_resume_text=compressed_resume_text,
        raw_text_chars=raw_text_chars,
    )


@router.post("/analyze", response_model=LearnerProfileAnalyzeResponse)
async def analyze_learner_profile(
    payload: LearnerProfileAnalyzeRequest,
) -> LearnerProfileAnalyzeResponse:
    normalized_text = normalize_profile_text(payload)
    similar_matches = await similarity_search(
        normalized_text,
        role_query=payload.target_interest or payload.current_role,
    )
    try:
        recommendation, llm_provider = await generate_recommendation(
            profile_text=normalized_text,
            matches=similar_matches,
        )
    except LocalLlmUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Local LLM failed to generate a valid response.",
        ) from exc

    return LearnerProfileAnalyzeResponse(
        normalized_text=normalized_text,
        similar_matches=similar_matches,
        recommendation=recommendation,
        llm_provider=llm_provider,
    )
