from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.core.auth.schemas import AuthUserUpdate__Password
from db.core.auth.services import update_authuser__password
from db.modules.users.crud import get_user_by_id
from db.modules.users.schemas import UserPublicResponse, UserPrivateResponse
from db.modules.users.services import get_current_user
from src.db.database import get_db

router = APIRouter()

@router.get("/create-user")
def create_user():
    return {"message": "pong"}

class GetUserResponse(BaseModel):
    success: bool
    user: Optional[UserPublicResponse]

@router.get("/user", response_model=GetUserResponse)
def get_user(
        id: int,
        current_user: UserPrivateResponse = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    user = get_user_by_id(id, db)
    if user is None:
        return {
            "success": False
        }
    else:
        return {
            "success": True,
            "user": user
        }

@router.post("/me", response_model=UserPrivateResponse)
def get_me(
        current_user: UserPrivateResponse = Depends(get_current_user)
):
    return current_user
    

class UpdatePasswordData(BaseModel):
    password: str
class UpdatePasswordResponse(BaseModel):
    success: bool
@router.post("/user-update-password", response_model=UpdatePasswordResponse)
def update_password(
        data: UpdatePasswordData,
        current_user: UserPrivateResponse = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    auth_services_data = AuthUserUpdate__Password.model_validate({
        "id": current_user.authuser_id,
        "password": data.password
    })
    success = update_authuser__password(auth_services_data, db)
    return {
        "success": success
    }