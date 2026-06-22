from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex}@example.com"


def test_create_and_retrieve_user() -> None:
    email = unique_email("learner")

    with TestClient(app) as client:
        create_response = client.post(
            "/users",
            json={
                "email": email,
                "full_name": "Lifelong Learner",
                "password": "strong-password",
            },
        )

        assert create_response.status_code == 201
        created_user = create_response.json()
        assert created_user["email"] == email
        assert created_user["full_name"] == "Lifelong Learner"
        assert "password" not in created_user
        assert "password_hash" not in created_user

        get_response = client.get(f"/users/{created_user['id']}")

    assert get_response.status_code == 200
    assert get_response.json()["email"] == email


def test_update_password() -> None:
    email = unique_email("password-update")

    with TestClient(app) as client:
        create_response = client.post(
            "/users",
            json={
                "email": email,
                "full_name": "Password Update",
                "password": "old-password",
            },
        )
        user_id = create_response.json()["id"]

        update_response = client.patch(
            f"/users/{user_id}/password",
            json={
                "current_password": "old-password",
                "new_password": "new-password",
            },
        )

    assert update_response.status_code == 200
    assert update_response.json()["id"] == user_id


def test_update_password_rejects_wrong_current_password() -> None:
    email = unique_email("wrong-password")

    with TestClient(app) as client:
        create_response = client.post(
            "/users",
            json={
                "email": email,
                "full_name": "Wrong Password",
                "password": "right-password",
            },
        )
        user_id = create_response.json()["id"]

        update_response = client.patch(
            f"/users/{user_id}/password",
            json={
                "current_password": "wrong-password",
                "new_password": "new-password",
            },
        )

    assert update_response.status_code == 400
