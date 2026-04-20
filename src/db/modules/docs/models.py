from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from db.base import Base
from datetime import datetime

from db.modules.users.models import User

class DocumentShare(Base):
    __tablename__ = "document_shares"

    doc_id = mapped_column(ForeignKey("documents.id"), primary_key=True)
    user_id = mapped_column(ForeignKey("users.id"), primary_key=True)

    permission = mapped_column(String, default="read")

    # relationships
    document: Mapped["Document"] = relationship(
        "Document", back_populates="shares"
    )
    user: Mapped["User"] = relationship(
        "User", back_populates="shares"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner: Mapped["User"] = relationship("User")

    title: Mapped[str] = mapped_column(String, nullable=False, default="Untitled")
    text: Mapped[str] = mapped_column(String, nullable=False, default="")
    
    shares: Mapped[list["DocumentShare"]] = relationship(
        "DocumentShare",
        back_populates="document",
        cascade="all, delete-orphan"
    )

    # convenience (optional)
    shared_users: Mapped[list["User"]] = relationship(
        "User",
        secondary="document_shares",
        viewonly=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
