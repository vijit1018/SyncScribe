from datetime import UTC, datetime
from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.database import Database

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.mongo import get_database
from app.models.user import serialize_user
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    database: Annotated[Database, Depends(get_database)],
) -> dict[str, Any]:
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication payload.")
    user = database.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, database: Annotated[Database, Depends(get_database)]) -> AuthResponse:
    email = payload.email.lower().strip()
    if database.users.find_one({"email": email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")

    user = {
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(UTC),
    }
    inserted = database.users.insert_one(user)
    user["_id"] = inserted.inserted_id
    token = create_access_token(str(user["_id"]))
    return AuthResponse(accessToken=token, user=serialize_user(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, database: Annotated[Database, Depends(get_database)]) -> AuthResponse:
    user = database.users.find_one({"email": payload.email.lower().strip()})
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")
    token = create_access_token(str(user["_id"]))
    return AuthResponse(accessToken=token, user=serialize_user(user))


@router.get("/me")
def me(current_user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
    return serialize_user(current_user)
