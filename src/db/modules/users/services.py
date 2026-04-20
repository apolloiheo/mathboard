


from db.core.auth.schemas import AuthUserCreate__Password
from db.core.auth.services import create_authuser
from db.core.auth.utils.token import verify_access_token
from db.database import get_db
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from db.modules.users.crud import create_user__authuser
from db.modules.users.models import User
from db.modules.users.schemas import UserCreate__AuthUser, UserPrivateResponse, UserPublicResponse


def create_user__password(
        data: AuthUserCreate__Password,
        db: Session = Depends(get_db),
):
    """
    Creates a new user. Does NOT parse to check if data is valid.

    Supports:
      - Password-based login
      - TODO: OAuth login (Google)
    Returns:
      dict:
        - code (int): Indicates if the user was created successfully
        - user (User, optional): AuthUser db object if successful
        - token (str, optional): Authorization bearer token if successful

    Code:
      - 100 = success
      - 0 = error
      - 10 = invalid username
      - 20 = invalid email
      - 30 = invalid password
      - 90 = account already exists (email duplicate from google_id?)
    """
    authuser_create_dict = create_authuser(data, db)
    if authuser_create_dict["code"] == 100:
        authuser_arg = UserCreate__AuthUser.model_validate({
            "authuser_id": authuser_create_dict["user"].id,
            "username": authuser_create_dict["username"],
            "email": authuser_create_dict["email"],
        })
        return {
            "code": 100,
            "user": create_user__authuser(authuser_arg, db),
            "token": authuser_create_dict["token"]
        }
    else:
        return {
            "code": authuser_create_dict["code"]
        }
    
def get_user_public(db: Session, user_id: int) -> UserPublicResponse:
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return UserPublicResponse.model_validate(user)

def get_user_private(db: Session, user_id: int) -> UserPrivateResponse:
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return UserPrivateResponse.model_validate(user)

def get_current_user(
        authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> UserPrivateResponse:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth scheme")
    token = authorization[7:]
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
