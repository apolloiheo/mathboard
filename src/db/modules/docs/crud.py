from db.core.auth.schemas import AuthUserCreate__Password
from db.modules.docs.models import Document
from db.modules.users.models import User
from db.modules.users.schemas import UserCreate__AuthUser
from fastapi import Depends
from sqlalchemy.orm import Session



def create_document(
        owner_id: int,
        db: Session,
):
    obj = Document(owner_id=owner_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_docs_by_owner_id(
        owner_id: int,
        db: Session,
        n: int=50,
):
    return db.query(Document).filter(Document.owner_id == owner_id).all()

def get_document_by_id(
        id: int,
        db: Session,
):
    return db.query(Document).filter(Document.id == id).first()

def update_document__title_text(
        doc: Document,
        db: Session,
        title: str|None=None,
        text: str|None=None,
):
    if title:
        doc.title = title
    if text:
        doc.text = text

    db.commit()
    db.refresh(doc)
    return True


def delete_document(
        doc: Document,
        db: Session,
):
    pass
    # TODO

