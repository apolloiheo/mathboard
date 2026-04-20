

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from db.modules.users.schemas import UserPublicResponse


class DocumentUpdate(BaseModel):
    text: Optional[str]
    title: Optional[str]

class DocumentResponse(BaseModel):
    id: int

    owner_id: int
    owner: UserPublicResponse

    title: str
    text: str

    created_at: datetime
    updated_at: datetime

class DocumentShareResponse(BaseModel):
    doc_id: int
    user_id: int
    share_type: str
    
    created_at: datetime
    updated_at: datetime