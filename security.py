import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from database import User, get_session

ALGORITHM = "HS256"
TOKEN_DAYS = 7


def _load_secret() -> str:
    env = os.getenv("SECRET_KEY")
    if env:
        return env
    path = Path(__file__).with_name(".secret_key")
    if path.exists():
        return path.read_text().strip()
    key = secrets.token_hex(32)
    try:
        path.write_text(key)
    except OSError:
        print("SECRET_KEY is not set and .secret_key cannot be written; logins will reset when the server restarts.")
    return key


SECRET_KEY = _load_secret()
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    session: Session = Depends(get_session),
) -> Optional[User]:
    if creds is None:
        return None
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    return session.get(User, user_id)


def current_user(user: Optional[User] = Depends(optional_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please log in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can do that.")
    return user
