import os
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, Session, SQLModel, create_engine

def _database_url() -> str:
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not url:
        return "sqlite:////tmp/upclick.db" if os.getenv("VERCEL") else "sqlite:///./upclick.db"
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


DATABASE_URL = _database_url()
IS_SQLITE = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
    pool_pre_ping=True,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    password_hash: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=utcnow)


class Course(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str
    category: str
    level: str
    hours: int
    rating: float = 0
    students: int = 0
    price: int
    instructor: str
    short: str
    description: str
    modules: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=utcnow)


class Enrolment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    course_id: str = Field(foreign_key="course.id", index=True)
    done: list[int] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    price_paid: int = 0
    enrolled_at: datetime = Field(default_factory=utcnow)
    completed_at: Optional[datetime] = None


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    rating: int
    message: str = ""
    created_at: datetime = Field(default_factory=utcnow)


def get_session():
    with Session(engine) as session:
        yield session
