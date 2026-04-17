from datetime import datetime
from typing import Any


def serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "createdAt": _iso(user["created_at"]),
    }


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
