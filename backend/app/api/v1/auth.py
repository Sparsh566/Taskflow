from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
import uuid
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.entities import User, Department
from app.models.enums import UserRole
from app.schemas.api_schemas import (
    LoginRequest, PersonaSwitchRequest, GoogleLoginRequest, Token, UserRead
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    req_email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(req_email)).first()

    # Stealth Defense: Admin accounts can NEVER be logged in through the public login form.
    # Return indistinguishable 401 error so attackers cannot confirm account existence.
    if user and user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    user_email = payload.email.strip().lower()

    # Master Admin isolation: Disallow admin access through public Google OAuth
    if user_email == settings.INITIAL_ADMIN_EMAIL.lower() or (
        db.query(User).filter(User.email.ilike(user_email), User.role == UserRole.ADMIN).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. This account cannot sign in via public Google portal."
        )

    user = db.query(User).filter(User.email.ilike(user_email)).first()
    if not user:
        # Provision new employee account for team member
        default_dept = db.query(Department).first()
        user = User(
            email=user_email,
            full_name=payload.full_name or user_email.split('@')[0].capitalize(),
            hashed_password=get_password_hash(uuid.uuid4().hex),
            role=UserRole.EMPLOYEE,
            department_id=default_dept.id if default_dept else None,
            avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_email}",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/switch-persona", response_model=Token)
def switch_persona(data: PersonaSwitchRequest, db: Session = Depends(get_db)):
    req_email = data.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(req_email)).first()
    
    # Camouflage: Never leak admin existence on public persona switch
    if not user or user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {data.email} not found"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
