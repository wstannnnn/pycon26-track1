from fastapi.testclient import TestClient

from app.dependencies import get_vector_db_client
from app.main import app
from app.schemas.vectors import VectorSearchHit


class FakeVectorDbClient:
    def find_role_records(self, role_query: str, limit: int = 5) -> list[VectorSearchHit]:
        assert role_query == "Data Analyst"
        assert limit == 12
        return [
            VectorSearchHit(
                id="job-role-data-analyst",
                score=1.0,
                payload={
                    "record_type": "job_role",
                    "role": "Data Analyst",
                    "sector": "Information and Communications",
                    "track": "Data and Artificial Intelligence",
                    "description": "Analyse datasets and communicate insights.",
                    "source": "skills_framework_joined_roles.jsonl",
                },
            )
        ]

    def search_text(self, text: str, limit: int = 5) -> list[VectorSearchHit]:
        raise AssertionError("pathway generation should use role-column lookup first")


async def override_vector_db_client():
    yield FakeVectorDbClient()


def test_create_career_pathway_from_chromadb_evidence() -> None:
    app.dependency_overrides[get_vector_db_client] = override_vector_db_client
    with TestClient(app) as client:
        response = client.post(
            "/roles/pathway",
            json={
                "current_role": "Customer Support Specialist",
                "target_interest": "Data Analyst",
            },
        )
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["pathway_name"] == "Data Analyst pathway from junior to top management"
    assert body["evidence"][0]["role"] == "Data Analyst"
    assert body["evidence"][0]["sector"] == "Information and Communications"
    assert body["evidence"][0]["source"] == "skills_framework_joined_roles.jsonl"
    assert body["levels"][0]["stage"] == "Junior"
    assert body["levels"][0]["title"] == "Junior Data Analyst"
    assert "Information and Communications" in body["levels"][0]["focus"]
    assert body["levels"][-1]["stage"] == "Top Management"
    assert body["levels"][-1]["title"] == "Executive leader for Data Analyst"


def test_create_career_pathway_requires_current_role_and_target_interest() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/roles/pathway",
            json={
                "current_role": "",
                "target_interest": "",
            },
        )

    assert response.status_code == 422
