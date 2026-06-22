from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas.learner import ResumeProfileExtraction
from app.services.resume_profile import compress_resume_text


def test_compress_resume_text_prioritises_resume_sections() -> None:
    text = (
        "Enjoys hiking. "
        "Experience: Data Analyst building SQL dashboards for operations teams. "
        "Skills: SQL, Python, Excel, stakeholder management. "
        + ("Low signal sentence. " * 200)
    )

    compressed = compress_resume_text(text, max_chars=180)

    assert "Data Analyst" in compressed
    assert "SQL" in compressed
    assert len(compressed) <= 180


def test_upload_resume_populates_profile_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_extract_resume_profile(pdf_bytes: bytes):
        assert pdf_bytes == b"%PDF fake"
        return (
            ResumeProfileExtraction(
                current_role="Data Analyst",
                skillset="SQL, Python, Dashboarding",
                summary="Analyst with dashboard experience.",
            ),
            "Experience: Data Analyst. Skills: SQL, Python, Dashboarding.",
            120,
        )

    monkeypatch.setattr(
        "app.routers.learner.extract_resume_profile",
        fake_extract_resume_profile,
    )

    with TestClient(app) as client:
        response = client.post(
            "/learner/resume/upload",
            files={"file": ("resume.pdf", b"%PDF fake", "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["current_role"] == "Data Analyst"
    assert body["skillset"] == "SQL, Python, Dashboarding"
    assert body["compressed_resume_text"].startswith("Experience: Data Analyst")
