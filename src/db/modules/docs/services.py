

from sqlalchemy.orm import Session

from db.modules.docs.crud import create_document, get_document_by_id, update_document__title_text, delete_document
from db.modules.docs.schemas import DocumentUpdate

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
    if doc.owner_id != user_id:
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
    