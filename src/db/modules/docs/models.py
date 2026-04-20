from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from db.base import Base
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner = relationship("User")

    title: Mapped[str] = mapped_column(String, nullable=False, default="Untitled")
    text: Mapped[str] = mapped_column(String, nullable=False, default="")

    # documents: Mapped[list["Document"]] = relationship(
    #     "Document", back_populates="owner"
    # )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
