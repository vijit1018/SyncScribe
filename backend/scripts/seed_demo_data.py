import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.mongo import get_database
from app.models.document import extract_plain_text

DEMO_USERS = [
    {"name": "Ava Owner", "email": "ava@example.com"},
    {"name": "Ben Editor", "email": "ben@example.com"},
    {"name": "Cara Viewer", "email": "cara@example.com"},
]


def main() -> None:
    settings = get_settings()
    database = get_database()
    users = {}
    for user in DEMO_USERS:
        existing = database.users.find_one({"email": user["email"]})
        if existing:
            users[user["email"]] = existing
            continue
        payload = {
            "name": user["name"],
            "email": user["email"],
            "password_hash": hash_password(settings.demo_user_password),
            "created_at": datetime.now(UTC),
        }
        inserted = database.users.insert_one(payload)
        payload["_id"] = inserted.inserted_id
        users[user["email"]] = payload

    if database.documents.count_documents({}) == 0:
        content = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Welcome to the collaborative editor"}],
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "This seeded document helps reviewers validate editing and sharing quickly.",
                        }
                    ],
                },
            ],
        }
        now = datetime.now(UTC)
        database.documents.insert_one(
            {
                "owner_id": users["ava@example.com"]["_id"],
                "title": "Team kickoff notes",
                "content": content,
                "content_preview": extract_plain_text(content)[:160],
                "shared_with": [
                    {
                        "user_id": users["ben@example.com"]["_id"],
                        "email": "ben@example.com",
                                "role": "editor",
                                "granted_at": now,
                            },
                            {
                                "user_id": users["cara@example.com"]["_id"],
                                "email": "cara@example.com",
                                "role": "viewer",
                        "granted_at": now,
                    }
                ],
                "created_at": now,
                "updated_at": now,
            }
        )

    print("Demo data seeded successfully.")


if __name__ == "__main__":
    main()
