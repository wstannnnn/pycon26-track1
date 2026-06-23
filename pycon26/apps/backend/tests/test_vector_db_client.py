import json
from pathlib import Path

from app.clients.vector_db import VectorDbClient, load_skill_records, load_unique_skills
from app.schemas.vectors import VectorPoint


def test_upsert_and_search_points_with_chromadb(tmp_path: Path) -> None:
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="skills_test",
        data_dir=str(tmp_path / "data"),
        auto_index=False,
    )

    response = client.upsert_points(
        [
            VectorPoint(
                id="python-data-analyst",
                document="Python data analysis dashboards SQL statistics",
                payload={"role": "Data Analyst", "skill": "Python", "source": "test"},
            )
        ]
    )

    matches = client.search_text("SQL dashboard analyst", limit=1)

    assert response == {"status": "ok", "result": {"upserted": 1}}
    assert json.loads(client.collection.metadata["metadata_keys"]) == [
        "role",
        "skill",
        "source",
    ]
    assert matches[0].id == "python-data-analyst"
    assert matches[0].payload["role"] == "Data Analyst"
    assert matches[0].payload["document"]


def test_collections_use_cosine_hnsw_space(tmp_path: Path) -> None:
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="cosine_job_skills_test",
        unique_skills_collection="cosine_unique_skills_test",
        data_dir=str(tmp_path / "data"),
        auto_index=False,
    )

    unique_collection = client.get_collection(
        "cosine_unique_skills_test",
        description="SkillsFuture unique skills list",
    )

    assert client.collection.configuration["hnsw"]["space"] == "cosine"
    assert unique_collection.configuration["hnsw"]["space"] == "cosine"


def test_cosine_search_scores_exact_match_as_one(tmp_path: Path) -> None:
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="cosine_score_test",
        data_dir=str(tmp_path / "data"),
        auto_index=False,
    )
    client.upsert_points(
        [
            VectorPoint(
                id="sql-dashboard",
                document="SQL dashboard",
                payload={"skill": "SQL"},
            )
        ]
    )

    matches = client.search_text("SQL dashboard", limit=1)

    assert matches[0].score == 1.0


def test_find_role_records_matches_role_column(tmp_path: Path) -> None:
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="roles_test",
        data_dir=str(tmp_path / "data"),
        auto_index=False,
    )
    client.upsert_points(
        [
            VectorPoint(
                id="job-role-quality-engineer",
                document="Role: Assistant Quality Engineer",
                payload={
                    "record_type": "job_role",
                    "role": "Assistant Quality Engineer",
                    "sector": "Manufacturing",
                },
            ),
            VectorPoint(
                id="job-role-data-analyst",
                document="Role: Data Analyst",
                payload={
                    "record_type": "job_role",
                    "role": "Data Analyst",
                    "sector": "Information and Communications",
                },
            ),
        ]
    )

    matches = client.find_role_records("Data Analyst", limit=1)

    assert matches[0].id == "job-role-data-analyst"
    assert matches[0].payload["role"] == "Data Analyst"


def test_search_text_prefers_skill_title_for_role_skill_matches(tmp_path: Path) -> None:
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="fused_results_test",
        data_dir=str(tmp_path / "data"),
        auto_index=False,
    )
    client.upsert_points(
        [
            VectorPoint(
                id="data-analyst-sql",
                document="Data Analyst SQL dashboards",
                payload={
                    "record_type": "role_skill",
                    "role": "Data Analyst",
                    "skill": "SQL",
                    "track": "Data and Artificial Intelligence",
                    "description": "Query data for analysis.",
                },
            ),
            VectorPoint(
                id="data-analyst-python",
                document="Data Analyst Python statistics",
                payload={
                    "record_type": "role_skill",
                    "role": "Data Analyst",
                    "skill": "Python",
                    "track": "Data and Artificial Intelligence",
                    "description": "Analyse data with Python.",
                },
            ),
        ]
    )

    matches = client.search_text("Data Analyst SQL Python", limit=5)

    assert len(matches) == 2
    assert {match.payload["skill"] for match in matches} == {"Python", "SQL"}
    assert {match.payload["role"] for match in matches} == {"Data Analyst"}
    assert all(
        match.payload["tracks"] == ["Data and Artificial Intelligence"] for match in matches
    )


def test_load_skill_records_from_joined_roles_jsonl(tmp_path: Path) -> None:
    data_dir = tmp_path / "data"
    processed_dir = data_dir / "processed"
    processed_dir.mkdir(parents=True)
    create_joined_roles_jsonl(processed_dir / "skills_framework_joined_roles.jsonl")

    records = list(load_skill_records(data_dir))

    assert [record.payload["record_type"] for record in records] == [
        "job_role",
        "role_skill",
        "key_task",
    ]
    assert records[0].payload["role"] == "Data Analyst"
    assert records[1].payload["skill"] == "Data Analytics"
    assert records[2].payload["task"] == "Build dashboards"


def test_load_unique_skills_from_processed_json(tmp_path: Path) -> None:
    path = tmp_path / "jobsandskills-skillsfuture-unique-skills-list.json"
    path.write_text(
        json.dumps(
            {
                "sheets": {
                    "Unique Skills List": [
                        {
                            "skill_title": "Data Analytics",
                            "skill_description": "Analyse data to identify patterns.",
                            "skill_type": "tsc",
                            "Emerging Skills": True,
                            "CASL Skills": False,
                        }
                    ]
                }
            }
        ),
        encoding="utf-8",
    )

    records = list(load_unique_skills(path))

    assert len(records) == 1
    assert records[0].payload == {
        "source": "jobsandskills-skillsfuture-unique-skills-list.json",
        "record_type": "unique_skill",
        "skill": "Data Analytics",
        "description": "Analyse data to identify patterns.",
        "skill_type": "tsc",
        "emerging_skill": True,
        "casl_skill": False,
    }


def test_index_unique_skills_uses_processed_json(tmp_path: Path) -> None:
    data_dir = tmp_path / "data"
    processed_dir = data_dir / "processed"
    processed_dir.mkdir(parents=True)
    (processed_dir / "jobsandskills-skillsfuture-unique-skills-list.json").write_text(
        json.dumps(
            {
                "sheets": {
                    "Unique Skills List": [
                        {
                            "skill_title": "Data Analytics",
                            "skill_description": "Analyse data to identify patterns.",
                            "skill_type": "tsc",
                            "Emerging Skills": False,
                            "CASL Skills": True,
                        }
                    ]
                }
            }
        ),
        encoding="utf-8",
    )
    client = VectorDbClient(
        path=str(tmp_path / "chroma"),
        collection="job_skills_test",
        unique_skills_collection="unique_skills_test",
        data_dir=str(data_dir),
        auto_index=False,
    )

    result = client.index_unique_skills()
    unique_collection = client.get_collection(
        "unique_skills_test",
        description="SkillsFuture unique skills list",
    )
    stored_records = unique_collection.get(limit=1, include=["metadatas"])

    assert result["indexed"] == 1
    assert result["collection"]["name"] == "unique_skills_test"
    assert result["collection"]["count"] == 1
    assert result["collection"]["metadata"]["description"] == "SkillsFuture unique skills list"
    assert json.loads(result["collection"]["metadata"]["metadata_keys"]) == [
        "casl_skill",
        "description",
        "emerging_skill",
        "record_type",
        "skill",
        "skill_type",
        "source",
    ]
    assert client.collection.count() == 0
    assert unique_collection.count() == 1
    assert stored_records["metadatas"][0]["record_type"] == "unique_skill"
    assert stored_records["metadatas"][0]["skill"] == "Data Analytics"
    assert stored_records["metadatas"][0]["casl_skill"] is True


def create_joined_roles_jsonl(path: Path) -> None:
    record = {
        "sector": "Information and Communications",
        "track": "Data and Artificial Intelligence",
        "job_role": "Data Analyst",
        "job_role_description": "Analyse datasets and communicate insights.",
        "performance_expectation": "Use reliable data and clear reporting.",
        "critical_work_functions": [
            {
                "critical_work_function": "Deliver business insights",
                "key_tasks": ["Build dashboards"],
            }
        ],
        "skills": [
            {
                "skill_code": "ICT-DAT-3001",
                "title": "Data Analytics",
                "type": "tsc",
                "category": "Digital and Data",
                "description": "Analyse data to identify patterns.",
                "proficiency_level": "3",
                "proficiency_description": "Apply analytics techniques.",
                "status": "active",
            }
        ],
        "concatenated_description": "Job role: Data Analyst\nSkill: Data Analytics",
    }
    path.write_text(json.dumps(record) + "\n", encoding="utf-8")
