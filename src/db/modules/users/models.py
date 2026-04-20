from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from db.base import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    authuser_id: Mapped[int] = mapped_column(ForeignKey("auth_users.id"))
    authuser = relationship("AuthUser")

    # username: Mapped[str] = mapped_column(ForeignKey("auth_users.username"))
    # email: Mapped[str] = mapped_column(ForeignKey("auth_users.email"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
