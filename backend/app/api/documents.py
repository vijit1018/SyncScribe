from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from pymongo.database import Database

from app.api.auth import get_current_user
from app.db.mongo import get_database
from app.models.document import serialize_document_detail, serialize_document_summary
from app.schemas.document import CreateDocumentRequest, ShareDocumentRequest, UpdateDocumentRequest
from app.services.document_service import (
    create_document,
    get_access_role,
    get_document_for_user,
    list_documents_for_user,
    share_document,
    update_document,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
def list_documents(
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    documents = list_documents_for_user(database, current_user)
    return {
        "owned": [serialize_document_summary(doc, access_role="owner") for doc in documents["owned"]],
        "shared": [
            serialize_document_summary(
                doc,
                owner_name=documents["owners"].get(str(doc["owner_id"])),
                access_role=get_access_role(doc, current_user["_id"]) or "viewer",
            )
            for doc in documents["shared"]
        ],
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_document_endpoint(
    payload: CreateDocumentRequest,
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    document = create_document(database, current_user, payload.title)
    return serialize_document_detail(document, owner_name=current_user["name"], access_role="owner")


@router.get("/{document_id}")
def get_document(
    document_id: str,
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    document = get_document_for_user(database, document_id, current_user)
    owner = database.users.find_one({"_id": document["owner_id"]})
    return serialize_document_detail(
        document,
        owner_name=owner["name"] if owner else None,
        access_role=get_access_role(document, current_user["_id"]) or "viewer",
    )


@router.patch("/{document_id}")
def update_document_endpoint(
    document_id: str,
    payload: UpdateDocumentRequest,
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    document = update_document(database, document_id, current_user, payload.model_dump(exclude_none=True))
    owner = database.users.find_one({"_id": document["owner_id"]})
    return serialize_document_detail(
        document,
        owner_name=owner["name"] if owner else None,
        access_role=get_access_role(document, current_user["_id"]) or "viewer",
    )


@router.post("/{document_id}/share")
def share_document_endpoint(
    document_id: str,
    payload: ShareDocumentRequest,
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    share_document(database, document_id, current_user, payload.email, payload.role)
    return {"message": f"Document shared with {payload.email} as {payload.role}."}
