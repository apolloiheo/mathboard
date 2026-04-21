

from sqlalchemy.orm import Session

from db.modules.docs.crud import create_document, create_documentshare, get_document_by_id, get_documentshare_by_ids, get_documentshares_by_id, update_document__title_text, delete_document, update_documentshare_with_share
from db.modules.docs.schemas import DocumentUpdate, DocumentShareResponse, DocumentShareResponseExpanded
from db.modules.docs.models import DocumentShare

def create_empty_untitled_doc(
        owner_id: int,
        db: Session
):
    return create_document(owner_id, db)
    
def update_doc_text__check_permissions(
        doc_id: int,
        user_id: int,
        update_data: DocumentUpdate,
        db: Session,
):
    """
    Ensures user has edit rights

    Return:
    - success (bool), indicating update was successful
    """
    doc = get_document_by_id(doc_id, db)
    if doc is None:
        return False
    
    # Check edit permissions
    if not user_can_write_document(doc_id, user_id, db):
        return False
    
    update_document__title_text(doc, db, **update_data.model_dump())
    return True
    

def delete_doc__check_permissions(
        doc_id: int,
        user_id: int,
        db: Session,
):
    """
    Ensures user is owner

    Return:
    - success (bool), indicating update was successful
    """
    doc = get_document_by_id(doc_id, db)
    if doc is None:
        return False
    
    # Check edit permissions
    if doc.owner_id != user_id:
        return False
    
    delete_document(doc, db)
    return True
    

# ---- DocumentShare ----
def user_can_write_document(
        doc_id: int,
        user_id: int,
        db: Session
):
    doc = get_document_by_id(doc_id, db)
    if doc is None:
        return False
    
    if doc.owner_id == user_id:
        return True
    
    share = get_documentshare_by_ids(doc_id, user_id, db)
    if not share:
        return False
    
    return share.permission == "write"

def user_can_read_document(
        doc_id: int,
        user_id: int,
        db: Session
):
    doc = get_document_by_id(doc_id, db)
    if doc is None:
        return False
    
    if doc.owner_id == user_id:
        return True
    
    share = get_documentshare_by_ids(doc_id, user_id, db)
    if not share:
        return False
    
    return True

def try_create_or_update_documentshare(
        doc_id: int,
        user_id: int,
        inviter_id: int,
        share_type: str,
        db: Session
) -> bool:
    """
    share_type (str): force check it's in read/write

    Return:
    - success (bool), indicating share was created
    """
    if share_type not in ["read", "write"]:
        return False
    
    # Verify and enforce owner/edit rights
    doc = get_document_by_id(doc_id, db)
    if doc is None:
        return False
    
    if doc.owner_id != inviter_id:
        inviter_share = get_documentshare_by_ids(doc_id, inviter_id, db)
        if inviter_share is None:
            return False
        if inviter_share.permission != "write":
            return False
    
    share = get_documentshare_by_ids(
        doc_id=doc_id,
        user_id=user_id,
        db=db
    )
    if share is None:
        # Create new share
        create_documentshare(
            doc_id=doc_id,
            user_id=user_id,
            share_type=share_type,
            db=db
        )
    else:
        # Update existing
        update_documentshare_with_share(
            share=share,
            share_type=share_type,
            db=db
        )
    return True

def try_get_documentshare(
        doc_id: int,
        user_id: int,
        db: Session
) -> DocumentShareResponse|None:
    if not user_can_read_document(doc_id, user_id, db):
        return None
    
    share = get_documentshare_by_ids(
        doc_id=doc_id,
        user_id=user_id,
        db=db
    )
    assert share is not None # from user_can_read_document()

    return DocumentShareResponse.model_validate(**share.model_dump())


def try_get_documentshares(
        doc_id: int,
        user_id: int,
        db: Session
) -> list[DocumentShareResponseExpanded]:
    if not user_can_read_document(doc_id, user_id, db):
        return []
    
    shares = get_documentshares_by_id(
        doc_id=doc_id,
        db=db
    )

    return [
        DocumentShareResponseExpanded(
            **DocumentShareResponse.model_validate(share).model_dump(),
            username=share.user.authuser.username
        )
        for share in shares
    ]


# ---- Document interaction ----
def view_document(
        doc_id: int,
        user_id: int,
        db: Session
):
    if not user_can_read_document(doc_id, user_id, db):
        return None
    
    return get_document_by_id(doc_id, db)