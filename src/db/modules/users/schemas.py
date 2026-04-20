from pydantic import BaseModel, EmailStr
from typing import Optional

from db.core.auth.models import AuthUser

# ---------- Create ----------
class UserCreate__AuthUser(BaseModel):
    authuser_id: int
    username: str
    email: EmailStr


# ---------- Get ----------
class UserPublicResponse(BaseModel):
    id: int
    username: str

class UserPrivateResponse(UserPublicResponse):
    authuser_id: int
    authuser: "AuthUser"

    email: EmailStr

    # ....

# ---------- Update ----------
class UserUpdate__Username(BaseModel):
    id: int
    username: str

class UserUpdate__Email(BaseModel):
    id: int
    username: str

class UserUpdate__Password(BaseModel):
    id: int
    username: str


