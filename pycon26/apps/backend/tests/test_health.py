from fastapi.testclient import TestClient

from app.main import app


def test_health_check() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_api_request_logging(caplog) -> None:
    with caplog.at_level("INFO", logger="job_skills.api"):
        with TestClient(app) as client:
            response = client.get("/health")

    assert response.status_code == 200
    assert "api_request method=GET path=/health status_code=200" in caplog.text
    assert 'response_body={"status":"ok"}' in caplog.text
