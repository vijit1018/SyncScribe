import re
from datetime import datetime
from typing import Any

DocumentAccessRole = str


def build_empty_content() -> dict[str, Any]:
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": ""}],
            }
        ],
    }


def extract_plain_text(content: dict[str, Any] | None) -> str:
    chunks: list[str] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if node.get("type") == "text" and node.get("text"):
                chunks.append(node["text"])
            for item in node.get("content", []):
                walk(item)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    if content:
        walk(content)
    return re.sub(r"\s+", " ", " ".join(chunks)).strip()


def normalize_shared_role(role: str | None) -> str:
    return role if role in {"editor", "viewer"} else "viewer"


def serialize_document_summary(
    document: dict[str, Any],
    owner_name: str | None = None,
    access_role: DocumentAccessRole = "owner",
) -> dict[str, Any]:
    return {
        "id": str(document["_id"]),
        "title": document["title"],
        "ownerId": str(document["owner_id"]),
        "ownerName": owner_name,
        "accessRole": access_role,
        "preview": document.get("content_preview", ""),
        "updatedAt": _iso(document.get("updated_at")),
        "createdAt": _iso(document.get("created_at")),
    }


def serialize_document_detail(
    document: dict[str, Any],
    owner_name: str | None = None,
    access_role: DocumentAccessRole = "owner",
) -> dict[str, Any]:
    data = serialize_document_summary(document, owner_name=owner_name, access_role=access_role)
    data["content"] = document["content"]
    data["sharedWith"] = [
        {
            "userId": str(entry["user_id"]),
            "email": entry.get("email", ""),
            "role": normalize_shared_role(entry.get("role")),
            "grantedAt": _iso(entry.get("granted_at")),
        }
        for entry in document.get("shared_with", [])
    ]
    return data


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
