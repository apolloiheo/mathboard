from pydantic import BaseModel, EmailStr
from typing import Optional

# ---------- Create ----------

class AuthUserCreate(BaseModel):
    username: Optional[str] = None          # may be auto-generated for OAuth
    email: EmailStr
    password: Optional[str] = None          # only for password-based accounts
    google_id: Optional[str] = None         # only for Google OAuth

class AuthUserCreate__Password(BaseModel):
    username: str
    email: EmailStr
    password: str


# ---------- Update ----------

class AuthUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class AuthUserUpdate__Username(BaseModel):
    id: int
    username: str

class AuthUserUpdate__Email(BaseModel):
    id: int
    email: EmailStr

class AuthUserUpdate__Password(BaseModel):
    id: int
    password: str

class AuthUserUpdate__PasswordHash(BaseModel):
    id: int
    password_hash: str



# ---------- Login ----------

class AuthUserLogin__UsernamePassword(BaseModel):
    username: str
    password: str