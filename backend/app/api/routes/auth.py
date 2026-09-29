from fastapi import APIRouter, HTTPException
from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.db import SessionLocal, User
from backend.app.schemas.contracts import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    with SessionLocal() as session:
        user = session.query(User).filter_by(username=payload.username).one_or_none()
        # The first admin is created only for local demo use; production must provision users explicitly.
        if not user and payload.username == "admin" and payload.password == "admin":
            user = User(username="admin", password_hash=hash_password("admin"), role="admin"); session.add(user); session.commit()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(401, "Invalid username or password")
        return TokenResponse(access_token=create_access_token(user.username, user.role))
