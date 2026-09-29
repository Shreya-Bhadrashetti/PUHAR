import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.config import get_settings

_bearer = HTTPBearer(auto_error=False)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def hash_password(password: str, salt: bytes | None = None) -> str:
    """Portable PBKDF2 storage format; avoids a hard dependency on a crypto package."""
    import os
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, salt, digest = stored.split("$", 2)
        if algorithm != "pbkdf2_sha256": return False
        candidate = hash_password(password, base64.urlsafe_b64decode(salt + "=" * (-len(salt) % 4)))
        return hmac.compare_digest(candidate, stored)
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(json.dumps({"sub": subject, "role": role, "exp": int((datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)).timestamp())}, separators=(",", ":")).encode())
    signature = _b64(hmac.new(settings.jwt_secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    if not credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    try:
        header, payload, signature = credentials.credentials.split(".")
        expected = _b64(hmac.new(get_settings().jwt_secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if claims["exp"] < datetime.now(timezone.utc).timestamp():
            raise ValueError("expired")
        return claims
    except (ValueError, KeyError, json.JSONDecodeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid access token")


def require_role(*roles: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return user
    return dependency
