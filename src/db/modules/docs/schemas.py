

from typing import Optional

from pydantic import BaseModel


class DocumentUpdate(BaseModel):
    text: Optional[str]
    title: Optional[str]