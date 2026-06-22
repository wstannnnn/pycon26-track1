from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def test_login_with_valid_credentials() -> None:
    email = f"login-{uuid4().hex}@example.com"

    with TestClient(app) as client:
        create_response = client.post(
            "/users",
            json={
                "email": email,
                "full_name": "Login User",
                "password": "correct-password",
            },
        )
        assert create_response.status_code == 201

        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": "correct-password",
            },
        )

    assert login_response.status_code == 200
    body = login_response.json()
    assert body["user"]["email"] == email
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


def test_login_rejects_invalid_credentials() -> None:
    email = f"login-invalid-{uuid4().hex}@example.com"

    with TestClient(app) as client:
        create_response = client.post(
            "/users",
            json={
                "email": email,
                "full_name": "Login User",
                "password": "correct-password",
            },
        )
        assert create_response.status_code == 201

        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": "wrong-password",
            },
        )

    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Invalid email or password."
