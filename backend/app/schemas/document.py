from typing import Any

from pydantic import BaseModel, EmailStr, Field
from typing_extensions import Literal


class CreateDocumentRequest(BaseModel):
    title: str = Field(default="Untitled document", min_length=1, max_length=120)


class UpdateDocumentRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    content: dict[str, Any] | None = None


class ShareDocumentRequest(BaseModel):
    email: EmailStr
    role: Literal["editor", "viewer"] = "viewer"
