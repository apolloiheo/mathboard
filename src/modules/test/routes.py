from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.db.database import get_db

router = APIRouter()

@router.get("/ping")
def ping():
    return {"message": "pong"}
