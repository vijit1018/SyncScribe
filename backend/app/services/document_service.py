from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

from app.models.document import build_empty_content, extract_plain_text, normalize_shared_role


def list_documents_for_user(database: Database, user: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    user_id = user["_id"]
    owned = list(database.documents.find({"owner_id": user_id}).sort("updated_at", -1))
    shared = list(database.documents.find({"shared_with.user_id": user_id}).sort("updated_at", -1))
    owners = {
        str(owner["_id"]): owner["name"]
        for owner in database.users.find({"_id": {"$in": list({doc["owner_id"] for doc in shared})}})
    }
    return {"owned": owned, "shared": shared, "owners": owners}


def create_document(
    database: Database,
    owner: dict[str, Any],
    title: str,
    content: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = datetime.now(UTC)
    document_content = content or build_empty_content()
    payload = {
        "owner_id": owner["_id"],
        "title": title.strip(),
        "content": document_content,
        "content_preview": extract_plain_text(document_content)[:160],
        "shared_with": [],
        "created_at": now,
        "updated_at": now,
    }
    result = database.documents.insert_one(payload)
    payload["_id"] = result.inserted_id
    return payload


def get_document_for_user(database: Database, document_id: str, user: dict[str, Any]) -> dict[str, Any]:
    document = _get_document_by_id(database, document_id)
    if get_access_role(document, user["_id"]) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this document.")
    return document


def update_document(
    database: Database,
    document_id: str,
    user: dict[str, Any],
    payload: dict[str, Any],
) -> dict[str, Any]:
    document = _get_document_by_id(database, document_id)
    role = get_access_role(document, user["_id"])
    if role not in {"owner", "editor"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this document.")

    updates: dict[str, Any] = {"updated_at": datetime.now(UTC)}
    if payload.get("title") is not None:
        updates["title"] = payload["title"].strip()
    if payload.get("content") is not None:
        updates["content"] = payload["content"]
        updates["content_preview"] = extract_plain_text(payload["content"])[:160]

    database.documents.update_one({"_id": document["_id"]}, {"$set": updates})
    document.update(updates)
    return document


def share_document(
    database: Database,
    document_id: str,
    owner: dict[str, Any],
    recipient_email: str,
    role: str,
) -> dict[str, Any]:
    document = _get_document_by_id(database, document_id)
    actor_role = get_access_role(document, owner["_id"])
    if actor_role not in {"owner", "editor"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to share this document.")

    recipient = database.users.find_one({"email": recipient_email.lower().strip()})
    if recipient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient account not found.")
    if str(recipient["_id"]) == str(owner["_id"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already own this document.")

    shared_with = document.get("shared_with", [])
    normalized_role = normalize_shared_role(role)
    existing_entry = next((entry for entry in shared_with if str(entry["user_id"]) == str(recipient["_id"])), None)
    if existing_entry is not None:
        database.documents.update_one(
            {"_id": document["_id"], "shared_with.user_id": recipient["_id"]},
            {
                "$set": {
                    "shared_with.$.role": normalized_role,
                    "shared_with.$.email": recipient["email"],
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        existing_entry["role"] = normalized_role
        existing_entry["email"] = recipient["email"]
        document["updated_at"] = datetime.now(UTC)
        return document

    shared_entry = {
        "user_id": recipient["_id"],
        "email": recipient["email"],
        "role": normalized_role,
        "granted_at": datetime.now(UTC),
    }
    database.documents.update_one(
        {"_id": document["_id"]},
        {"$push": {"shared_with": shared_entry}, "$set": {"updated_at": datetime.now(UTC)}},
    )
    document.setdefault("shared_with", []).append(shared_entry)
    return document


def _get_document_by_id(database: Database, document_id: str) -> dict[str, Any]:
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    document = database.documents.find_one({"_id": ObjectId(document_id)})
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


def get_access_role(document: dict[str, Any], user_id: ObjectId) -> str | None:
    if str(document["owner_id"]) == str(user_id):
        return "owner"
    shared_entry = next(
        (entry for entry in document.get("shared_with", []) if str(entry["user_id"]) == str(user_id)),
        None,
    )
    if shared_entry is None:
        return None
    return normalize_shared_role(shared_entry.get("role"))
