from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.core.auth.schemas import AuthUserUpdate__Password
from db.core.auth.services import update_authuser__password
from db.modules.docs.crud import get_docs_by_owner_id
from db.modules.docs.schemas import DocumentResponse, DocumentUpdate
from db.modules.docs.services import create_empty_untitled_doc, try_create_or_update_documentshare, update_doc_text__check_permissions, delete_doc__check_permissions, try_get_documentshare
from db.modules.users.crud import get_user_by_id
from db.modules.users.schemas import UserPublicResponse, UserPrivateResponse
from db.modules.users.services import get_current_user
from db.database import get_db

router = APIRouter()

class CreateDocResponse(BaseModel):
    doc_id: int

@router.get("/create-doc", response_model=CreateDocResponse)
def create_user(
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = create_empty_untitled_doc(current_user.id, db)
    return {
        "doc_id": doc.id
    }

class DocsData(BaseModel):
    own: bool=True

class DocsResponse(BaseModel):
    docs: list[DocumentResponse]

@router.get("/docs", response_model=DocsResponse)
def get_docs(
    data: DocsData,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.own:
        return get_docs_by_owner_id(current_user.id, db)

class SuccessResponse(BaseModel):
    success: bool

@router.post("/update-doc", response_model=SuccessResponse)
def update_doc_text(
    doc_id: int,
    text: Optional[str|None]=None,
    title: Optional[str|None]=None,
    current_user: UserPrivateResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = DocumentUpdate.model_validate({
        "text": text,
        "title": title,
    })
    success = update_doc_text__check_permissions(
        doc_id=doc_id,
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
    