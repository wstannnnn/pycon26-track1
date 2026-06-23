from fastapi.testclient import TestClient

from app.main import app


class FakeVectorDbClient:
    collections = [
        {
            "name": "job_skills",
            "metadata": {"description": "SkillsFuture skills, roles, tasks, and mappings"},
            "count": 10,
        },
        {
            "name": "unique_skills_test",
            "metadata": {"description": "SkillsFuture unique skills list"},
            "count": 3,
        },
    ]

    def list_collections(self) -> list[dict[str, object]]:
        return self.collections

    def index_unique_skills(self) -> dict[str, object]:
        collection = self.list_collections()[1]
        return {"indexed": collection["count"], "collection": collection}


def test_list_collections_endpoint(monkeypatch) -> None:
    monkeypatch.setattr("app.routers.vectors.vector_db_client", FakeVectorDbClient())

    with TestClient(app) as client:
        response = client.get("/vectors/collections")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "result": {
            "collections": [
                {
                    "name": "job_skills",
                    "metadata": {
                        "description": "SkillsFuture skills, roles, tasks, and mappings"
                    },
                    "count": 10,
                },
                {
                    "name": "unique_skills_test",
                    "metadata": {"description": "SkillsFuture unique skills list"},
                    "count": 3,
                }
            ],
            "count": 2,
            "total": 2,
        },
    }


def test_index_unique_skills_endpoint(monkeypatch) -> None:
    monkeypatch.setattr("app.routers.vectors.vector_db_client", FakeVectorDbClient())

    with TestClient(app) as client:
        response = client.post("/vectors/index/unique-skills")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "result": {
            "indexed": 3,
            "collection": {
                "name": "unique_skills_test",
                "metadata": {"description": "SkillsFuture unique skills list"},
                "count": 3,
            },
        },
    }
