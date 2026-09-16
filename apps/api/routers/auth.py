"""
Auth Router: Authentication & RBAC
Endpoints for user login, token refresh, and profile inspection.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
import models
from auth import verify_password, create_access_token, get_current_user, revoke_token, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    status: str
    message: str


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password, returning JWT token."""
    stmt = select(models.User).where(models.User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: models.User = Depends(get_current_user)
):
    """Revoke authenticated session token and record logout audit."""
    token = credentials.credentials
    revoke_token(token)
    return LogoutResponse(
        status="LOGGED_OUT",
        message="Session revoked successfully."
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return profile information of currently authenticated user."""
    return UserResponse.from_orm(current_user)

