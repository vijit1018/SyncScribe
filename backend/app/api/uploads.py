from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, UploadFile, status
from pymongo.database import Database

from app.api.auth import get_current_user
from app.db.mongo import get_database
from app.models.document import serialize_document_detail
from app.services.document_service import create_document
from app.services.upload_service import parse_uploaded_document

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_document(
    file: Annotated[UploadFile, File(...)],
    database: Annotated[Database, Depends(get_database)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    title, content = parse_uploaded_document(file)
    document = create_document(database, current_user, title, content=content)
    return serialize_document_detail(document, owner_name=current_user["name"])
