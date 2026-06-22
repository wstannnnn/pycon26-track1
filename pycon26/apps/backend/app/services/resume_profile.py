from io import BytesIO
import logging
import re

import httpx

from app.clients.local_llm import LocalLlmClient, local_llm_client
from app.schemas.learner import ResumeProfileExtraction


logger = logging.getLogger("job_skills.llm")
MAX_PDF_BYTES = 8 * 1024 * 1024
MAX_COMPRESSED_RESUME_CHARS = 3_000
KEYWORD_PATTERN = re.compile(
    r"\b(experience|work|role|skills?|tools?|projects?|education|certifications?|"
    r"python|sql|excel|dashboard|analytics?|management|stakeholder|cloud|data)\b",
    re.IGNORECASE,
)


class ResumePdfError(Exception):
    pass


class ResumeProfileExtractionError(Exception):
    pass


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise ResumePdfError("PDF file is too large.")

    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise ResumePdfError("PDF text extraction dependency is not installed.") from exc

    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:
        raise ResumePdfError("Unable to read PDF resume.") from exc

    text = normalize_whitespace("\n".join(pages))
    if not text:
        raise ResumePdfError("No readable text found in the PDF resume.")

    return text


def compress_resume_text(text: str, max_chars: int = MAX_COMPRESSED_RESUME_CHARS) -> str:
    normalized = normalize_whitespace(text)
    if len(normalized) <= max_chars:
        return normalized

    sentences = split_sentences(normalized)
    scored_sentences = sorted(
        enumerate(sentences),
        key=lambda item: (score_sentence(item[1]), -item[0]),
        reverse=True,
    )
    selected_indexes: list[int] = []
    total_chars = 0
    for index, sentence in scored_sentences:
        sentence_length = len(sentence) + 1
        if total_chars + sentence_length > max_chars:
            continue
        selected_indexes.append(index)
        total_chars += sentence_length

    selected = [sentences[index] for index in sorted(selected_indexes)]
    compressed = " ".join(selected).strip()
    return compressed or normalized[:max_chars].strip()


async def extract_resume_profile(
    pdf_bytes: bytes,
    client: LocalLlmClient = local_llm_client,
) -> tuple[ResumeProfileExtraction, str, int]:
    raw_text = extract_text_from_pdf(pdf_bytes)
    compressed_text = compress_resume_text(raw_text)

    try:
        profile = await client.extract_resume_profile(compressed_text)
    except (httpx.HTTPError, ValueError) as exc:
        logger.exception(
            "resume_profile_llm_failed provider=%s base_url=%s model=%s error_type=%s error=%s",
            getattr(client, "provider", "unknown"),
            getattr(client, "base_url", "unknown"),
            getattr(client, "model", "unknown"),
            type(exc).__name__,
            str(exc),
        )
        raise ResumeProfileExtractionError("Local LLM failed to extract resume profile.") from exc

    if profile is None:
        raise ResumeProfileExtractionError("Local LLM is disabled.")

    return profile, compressed_text, len(raw_text)


def split_sentences(text: str) -> list[str]:
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", text)
        if sentence.strip()
    ]


def score_sentence(sentence: str) -> int:
    score = len(KEYWORD_PATTERN.findall(sentence))
    if ":" in sentence:
        score += 2
    if "," in sentence:
        score += 1
    return score


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()
