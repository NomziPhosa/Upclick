import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, select

from database import Course, Enrolment, Feedback, User, engine, get_session, utcnow
from security import admin_user, create_token, current_user, hash_password, optional_user, verify_password
from seed_data import COURSES

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
LEVELS = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
BUNDLE_MIN = 2
BUNDLE_RATE = 0.10
STATIC_DIR = Path(__file__).with_name("static")


def seed_database() -> None:
    SQLModel.metadata.create_all(engine)
    try:
        _seed()
    except IntegrityError:
        pass


def _seed() -> None:
    with Session(engine) as session:
        if session.exec(select(Course)).first() is None:
            for course in COURSES:
                session.add(Course(**course))
        admin_email = os.getenv("ADMIN_EMAIL", "admin@upclick.test").strip().lower()
        if session.exec(select(User).where(User.email == admin_email)).first() is None:
            session.add(User(
                name="UpClick Admin",
                email=admin_email,
                password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "upclick-admin")),
                is_admin=True,
            ))
        session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="UpClick API",
    version="1.0.0",
    description="Backend for the UpClick online coding school (IMY 320 group design).",
    lifespan=lifespan,
)


def clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address, like you@example.com.")
    return value


class RegisterIn(BaseModel):
    name: str = Field(max_length=80)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Please enter your name.")
        return value

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return clean_email(value)


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class CourseIn(BaseModel):
    id: Optional[str] = Field(default=None, max_length=80)
    title: str = Field(min_length=3, max_length=120)
    category: str = Field(min_length=2, max_length=40)
    level: Literal["Beginner", "Intermediate", "Advanced"]
    hours: int = Field(ge=1, le=500)
    price: int = Field(ge=0, le=100000)
    instructor: str = Field(min_length=2, max_length=80)
    short: str = Field(min_length=5, max_length=160)
    description: str = Field(min_length=10, max_length=2000)
    modules: list[str] = Field(min_length=1, max_length=40)

    @field_validator("title", "category", "instructor", "short", "description")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("modules")
    @classmethod
    def check_modules(cls, value: list[str]) -> list[str]:
        cleaned = [m.strip() for m in value if m.strip()]
        if not cleaned:
            raise ValueError("Add at least one lesson.")
        return cleaned


class CheckoutIn(BaseModel):
    course_ids: list[str] = Field(min_length=1, max_length=50)


class LessonIn(BaseModel):
    done: bool


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    message: str = Field(default="", max_length=1000)


def iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def user_out(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "is_admin": user.is_admin}


def course_out(course: Course) -> dict:
    return {
        "id": course.id, "title": course.title, "category": course.category, "level": course.level,
        "hours": course.hours, "rating": course.rating, "students": course.students, "price": course.price,
        "instructor": course.instructor, "short": course.short, "description": course.description,
        "modules": list(course.modules),
    }


def enrolment_out(enrolment: Enrolment) -> dict:
    return {
        "course_id": enrolment.course_id,
        "done": list(enrolment.done),
        "enrolled_at": iso(enrolment.enrolled_at),
        "completed_at": iso(enrolment.completed_at),
    }


def auth_response(user: User) -> dict:
    return {"token": create_token(user.id), "user": user_out(user)}


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60].strip("-")
    return slug or "course"


def get_course_or_404(session: Session, course_id: str) -> Course:
    course = session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


@app.get("/api/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/auth/register", status_code=201, tags=["auth"])
def register(data: RegisterIn, session: Session = Depends(get_session)) -> dict:
    if session.exec(select(User).where(User.email == data.email)).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists. Try logging in.")
    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return auth_response(user)


@app.post("/api/auth/login", tags=["auth"])
def login(data: LoginIn, session: Session = Depends(get_session)) -> dict:
    user = session.exec(select(User).where(User.email == data.email.strip().lower())).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return auth_response(user)


@app.get("/api/auth/me", tags=["auth"])
def me(user: User = Depends(current_user)) -> dict:
    return user_out(user)


@app.get("/api/courses", tags=["courses"])
def list_courses(
    q: str = "",
    category: str = "All",
    level: str = "All",
    sort: Literal["title", "level", "hours", "rating", "price", "students"] = "students",
    direction: Literal["asc", "desc"] = Query("desc", alias="dir"),
    session: Session = Depends(get_session),
) -> list[dict]:
    needle = q.strip().lower()
    courses = [
        c for c in session.exec(select(Course)).all()
        if (category == "All" or c.category == category)
        and (level == "All" or c.level == level)
        and (not needle or needle in " ".join([c.title, c.short, c.category, c.level, c.instructor, *c.modules]).lower())
    ]

    def key(course: Course):
        if sort == "level":
            return LEVELS.get(course.level, 0)
        value = getattr(course, sort)
        return value.lower() if isinstance(value, str) else value

    courses.sort(key=key, reverse=direction == "desc")
    return [course_out(c) for c in courses]


@app.get("/api/courses/{course_id}", tags=["courses"])
def get_course(course_id: str, session: Session = Depends(get_session)) -> dict:
    return course_out(get_course_or_404(session, course_id))


@app.post("/api/courses", status_code=201, tags=["admin"])
def create_course(data: CourseIn, _: User = Depends(admin_user), session: Session = Depends(get_session)) -> dict:
    base = slugify(data.id or data.title)
    course_id, n = base, 2
    while session.get(Course, course_id) is not None:
        course_id, n = f"{base}-{n}", n + 1
    course = Course(id=course_id, **data.model_dump(exclude={"id"}))
    session.add(course)
    session.commit()
    session.refresh(course)
    return course_out(course)


@app.put("/api/courses/{course_id}", tags=["admin"])
def update_course(
    course_id: str, data: CourseIn, _: User = Depends(admin_user), session: Session = Depends(get_session)
) -> dict:
    course = get_course_or_404(session, course_id)
    for field, value in data.model_dump(exclude={"id"}).items():
        setattr(course, field, value)
    lesson_count = len(course.modules)
    for enrolment in session.exec(select(Enrolment).where(Enrolment.course_id == course_id)).all():
        kept = [i for i in enrolment.done if i < lesson_count]
        if kept != enrolment.done:
            enrolment.done = kept
            session.add(enrolment)
    session.add(course)
    session.commit()
    session.refresh(course)
    return course_out(course)


@app.delete("/api/courses/{course_id}", status_code=204, tags=["admin"])
def delete_course(course_id: str, _: User = Depends(admin_user), session: Session = Depends(get_session)) -> Response:
    course = get_course_or_404(session, course_id)
    if session.exec(select(Enrolment).where(Enrolment.course_id == course_id)).first():
        raise HTTPException(status_code=409, detail="Learners are enrolled in this course, so it can't be deleted.")
    session.delete(course)
    session.commit()
    return Response(status_code=204)


@app.post("/api/checkout", status_code=201, tags=["learning"])
def checkout(data: CheckoutIn, user: User = Depends(current_user), session: Session = Depends(get_session)) -> dict:
    courses = []
    for course_id in dict.fromkeys(data.course_ids):
        course = session.get(Course, course_id)
        if course is None:
            raise HTTPException(status_code=404, detail="One of the courses in your cart is no longer available.")
        courses.append(course)
    owned = set(session.exec(select(Enrolment.course_id).where(Enrolment.user_id == user.id)).all())
    new = [c for c in courses if c.id not in owned]
    if not new:
        raise HTTPException(status_code=409, detail="You're already enrolled in these courses.")
    bundle = len(new) >= BUNDLE_MIN
    subtotal = sum(c.price for c in new)
    discount = int(subtotal * BUNDLE_RATE + 0.5) if bundle else 0
    enrolments = []
    for course in new:
        enrolment = Enrolment(
            user_id=user.id,
            course_id=course.id,
            done=[],
            price_paid=int(course.price * (1 - BUNDLE_RATE) + 0.5) if bundle else course.price,
        )
        course.students += 1
        session.add(course)
        session.add(enrolment)
        enrolments.append(enrolment)
    session.commit()
    for enrolment in enrolments:
        session.refresh(enrolment)
    return {
        "enrolled": [c.id for c in new],
        "subtotal": subtotal,
        "discount": discount,
        "total": subtotal - discount,
        "enrolments": [enrolment_out(e) for e in enrolments],
    }


@app.get("/api/me/enrolments", tags=["learning"])
def my_enrolments(user: User = Depends(current_user), session: Session = Depends(get_session)) -> list[dict]:
    rows = session.exec(
        select(Enrolment).where(Enrolment.user_id == user.id).order_by(Enrolment.enrolled_at)
    ).all()
    return [enrolment_out(e) for e in rows]


@app.put("/api/me/enrolments/{course_id}/lessons/{index}", tags=["learning"])
def set_lesson(
    course_id: str,
    index: int,
    data: LessonIn,
    user: User = Depends(current_user),
    session: Session = Depends(get_session),
) -> dict:
    enrolment = session.exec(
        select(Enrolment).where(Enrolment.user_id == user.id, Enrolment.course_id == course_id)
    ).first()
    if enrolment is None:
        raise HTTPException(status_code=404, detail="You're not enrolled in this course.")
    course = get_course_or_404(session, course_id)
    if not 0 <= index < len(course.modules):
        raise HTTPException(status_code=404, detail="Lesson not found.")
    done = set(enrolment.done)
    if data.done:
        done.add(index)
    else:
        done.discard(index)
    enrolment.done = sorted(done)
    just_completed = False
    if len(enrolment.done) == len(course.modules):
        if enrolment.completed_at is None:
            enrolment.completed_at = utcnow()
            just_completed = True
    else:
        enrolment.completed_at = None
    session.add(enrolment)
    session.commit()
    session.refresh(enrolment)
    return {**enrolment_out(enrolment), "just_completed": just_completed}


@app.post("/api/feedback", status_code=201, tags=["feedback"])
def send_feedback(
    data: FeedbackIn,
    user: Optional[User] = Depends(optional_user),
    session: Session = Depends(get_session),
) -> dict:
    session.add(Feedback(user_id=user.id if user else None, rating=data.rating, message=data.message.strip()))
    session.commit()
    return {"ok": True}


@app.get("/api/admin/summary", tags=["admin"])
def admin_summary(_: User = Depends(admin_user), session: Session = Depends(get_session)) -> dict:
    all_users = session.exec(select(User)).all()
    users = [u for u in all_users if not u.is_admin]
    enrolments = session.exec(select(Enrolment)).all()
    feedback = session.exec(select(Feedback).order_by(Feedback.created_at.desc())).all()
    names = {u.id: u.name for u in all_users}
    ratings = [f.rating for f in feedback]
    return {
        "learners": len(users),
        "courses": len(session.exec(select(Course)).all()),
        "enrolments": len(enrolments),
        "completions": sum(1 for e in enrolments if e.completed_at is not None),
        "revenue": sum(e.price_paid for e in enrolments),
        "feedback_count": len(feedback),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else None,
        "recent_feedback": [
            {
                "name": names.get(f.user_id, "Guest") if f.user_id else "Guest",
                "rating": f.rating,
                "message": f.message,
                "created_at": iso(f.created_at),
            }
            for f in feedback[:20]
        ],
    }


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
