import io

import mongomock
from fastapi.testclient import TestClient

from app.db.mongo import get_database
from app.main import app


def create_client():
    database = mongomock.MongoClient().db
    app.dependency_overrides[get_database] = lambda: database
    return TestClient(app), database


def register_user(client: TestClient, name: str, email: str) -> str:
    response = client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": "Password123!"},
    )
    assert response.status_code == 201
    return response.json()["accessToken"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_document_sharing_permissions():
    client, _ = create_client()
    owner_token = register_user(client, "Owner User", "owner@example.com")
    editor_token = register_user(client, "Editor User", "editor@example.com")
    viewer_token = register_user(client, "Viewer User", "viewer@example.com")
    outsider_token = register_user(client, "Outsider User", "outsider@example.com")

    create_response = client.post("/documents", json={"title": "Shared plan"}, headers=auth_headers(owner_token))
    document_id = create_response.json()["id"]

    editor_share_response = client.post(
        f"/documents/{document_id}/share",
        json={"email": "editor@example.com", "role": "editor"},
        headers=auth_headers(owner_token),
    )
    assert editor_share_response.status_code == 200

    viewer_share_response = client.post(
        f"/documents/{document_id}/share",
        json={"email": "viewer@example.com", "role": "viewer"},
        headers=auth_headers(owner_token),
    )
    assert viewer_share_response.status_code == 200

    editor_doc = client.get(f"/documents/{document_id}", headers=auth_headers(editor_token))
    assert editor_doc.status_code == 200
    assert editor_doc.json()["title"] == "Shared plan"
    assert editor_doc.json()["accessRole"] == "editor"

    viewer_doc = client.get(f"/documents/{document_id}", headers=auth_headers(viewer_token))
    assert viewer_doc.status_code == 200
    assert viewer_doc.json()["accessRole"] == "viewer"

    editor_update = client.patch(
        f"/documents/{document_id}",
        json={"title": "Editor updated title"},
        headers=auth_headers(editor_token),
    )
    assert editor_update.status_code == 200
    assert editor_update.json()["title"] == "Editor updated title"

    viewer_update = client.patch(
        f"/documents/{document_id}",
        json={"title": "Viewer should fail"},
        headers=auth_headers(viewer_token),
    )
    assert viewer_update.status_code == 403

    editor_can_share = client.post(
        f"/documents/{document_id}/share",
        json={"email": "outsider@example.com", "role": "viewer"},
        headers=auth_headers(editor_token),
    )
    assert editor_can_share.status_code == 200

    outsider_doc = client.get(f"/documents/{document_id}", headers=auth_headers(outsider_token))
    assert outsider_doc.status_code == 200
    assert outsider_doc.json()["accessRole"] == "viewer"

    viewer_cannot_share = client.post(
        f"/documents/{document_id}/share",
        json={"email": "editor@example.com", "role": "viewer"},
        headers=auth_headers(viewer_token),
    )
    assert viewer_cannot_share.status_code == 403


def test_markdown_import_creates_document():
    client, _ = create_client()
    token = register_user(client, "Importer", "importer@example.com")
    file_bytes = io.BytesIO(b"# Imported title\n\n- first\n- second")

    response = client.post(
        "/uploads/import",
        files={"file": ("notes.md", file_bytes, "text/markdown")},
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "notes"
    assert body["content"]["type"] == "doc"
