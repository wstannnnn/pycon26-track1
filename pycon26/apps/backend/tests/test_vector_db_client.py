import json
from pathlib import Path

from app.clients.vector_db import VectorDbClient, load_skill_records
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
    assert matches[0].id == "python-data-analyst"
    assert matches[0].payload["role"] == "Data Analyst"
    assert matches[0].payload["document"]


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


def test_search_text_fuses_results_with_same_display_name(tmp_path: Path) -> None:
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
                    "description": "Analyse data with Python.",
                },
            ),
        ]
    )

    matches = client.search_text("Data Analyst SQL Python", limit=5)

    assert len(matches) == 1
    assert matches[0].payload["role"] == "Data Analyst"
    assert matches[0].payload["skills"] == ["SQL", "Python"]
    assert sorted(matches[0].payload["matched_ids"]) == [
        "data-analyst-python",
        "data-analyst-sql",
    ]


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
