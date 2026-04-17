import mongomock
from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import get_settings

_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        if settings.mongodb_uri.startswith("mongomock://"):
            _client = mongomock.MongoClient()
        else:
            _client = MongoClient(settings.mongodb_uri)
    return _client


def get_database() -> Database:
    settings = get_settings()
    return get_mongo_client()[settings.mongodb_db_name]


def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
