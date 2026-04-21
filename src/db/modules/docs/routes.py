from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.core.auth.schemas import AuthUserUpdate__Password
from db.core.auth.services import update_authuser__password
from db.modules.docs.crud import get_docs_by_owner_id
from db.modules.docs.schemas import DocumentResponse, DocumentUpdate
from db.modules.docs.services import create_empty_untitled_doc, try_create_or_update_documentshare, update_doc_text__check_permissions, delete_doc__check_permissions, try_get_documentshare, view_document
from db.modules.users.crud import get_user_by_id
from db.modules.users.models import User
from db.modules.users.schemas import UserPublicResponse, UserPrivateResponse
from db.modules.users.services import get_current_user
from db.database import get_db

router = APIRouter()

class CreateDocData(BaseModel):
    template: Optional[str] = "Blank Document"
    title: Optional[str] = "New document"

class CreateDocResponse(BaseModel):
    doc_id: int

@router.post("/docs/new", response_model=CreateDocResponse)
def create_doc(
    data: CreateDocData,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = create_empty_untitled_doc(current_user.id, db)
    return {
        "doc_id": doc.id
    }

class DocsResponse(BaseModel):
    docs: list[DocumentResponse]

@router.get("/my-docs", response_model=DocsResponse)
def get_docs(
    own: bool = True,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if own:
        return {
            "docs": get_docs_by_owner_id(current_user.id, db)
        }
    
@router.get("/docs/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = view_document(doc_id, current_user.id, db)
    return doc

class SuccessResponse(BaseModel):
    success: bool

class UpdateDocData(BaseModel):
    doc_id: int
    text: Optional[str|None]=None
    title: Optional[str|None]=None

@router.post("/update-doc", response_model=SuccessResponse)
def update_doc_text(
    data: UpdateDocData,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = DocumentUpdate.model_validate({
        "text": data.text,
        "title": data.title,
    })
    success = update_doc_text__check_permissions(
        doc_id=data.doc_id,
        user_id=current_user.id,
        update_data=update_data,
        db=db
    )
    return {
        "success": success
    }

@router.delete("/doc", response_model=SuccessResponse)
def delete_doc(
    doc_id: int,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = delete_doc__check_permissions(
        doc_id=doc_id,
        user_id=current_user.id,
        db=db
    )
    return {
        "success": success
    }


# ---- DocumentShare ----
class DocShareData(BaseModel):
    doc_id: int
    user_id: int
    share_type: str

@router.post("/doc-share", response_model=SuccessResponse)
def share_doc(
    data: DocShareData,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):  
    success = try_create_or_update_documentshare(
        doc_id=data.doc_id,
        user_id=data.user_id,
        inviter_id=current_user.id,
        share_type=data.share_type,
        db=db
    )
    return {
        "success": success
    }

class DocShareGetData(BaseModel):
    doc_id: int

@router.get("/doc-share", response_model=DocShareData | None)
def get_docshare(
    data: DocShareGetData,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return try_get_documentshare(
        doc_id=data.doc_id,
        user_id=current_user.id,
        db=db
    )
    