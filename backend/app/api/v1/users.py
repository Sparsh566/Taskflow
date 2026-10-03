from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.entities import User
from app.models.enums import UserRole
from app.schemas.api_schemas import UserCreate, UserRead, UserUpdate
from app.api.deps import get_current_user, require_admin, require_manager_or_admin

router = APIRouter(prefix="/users", tags=["Users"])

from app.core.config import settings

@router.get("", response_model=List[UserRead])
def list_users(
    department_id: Optional[str] = None,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)
    
    # Camouflage: Never expose administrator accounts to non-admin users
    if current_user.role != UserRole.ADMIN:
        query = query.filter(User.role != UserRole.ADMIN)

    if department_id:
        query = query.filter(User.department_id == department_id)
    if role:
        query = query.filter(User.role == role)
    return query.all()

from app.models.entities import User, WorkspaceMember

@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    req_email = user_in.email.strip().lower()

    # Disallow creation of admin or hijacking master email
    if user_in.role == UserRole.ADMIN or req_email == settings.INITIAL_ADMIN_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creation of administrator accounts through standard endpoints is strictly prohibited."
        )

    existing = db.query(User).filter(User.email == req_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    pwd = user_in.password or "emp123"
    hashed_pw = get_password_hash(pwd)
    
    avatar = user_in.avatar_url
    if not avatar:
        avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.email}"

    user_dict = user_in.model_dump(exclude={"password", "workspace_id"})
    user_dict["email"] = req_email
    user_dict["avatar_url"] = avatar

    user = User(**user_dict, hashed_password=hashed_pw)
    db.add(user)
    db.flush()

    # If workspace_id was passed, automatically add to that workspace
    if user_in.workspace_id:
        db.add(WorkspaceMember(
            workspace_id=user_in.workspace_id,
            user_id=user.id,
            role="member"
        ))

    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserRead)
def get_user_details(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Camouflage admin details
    if user.role == UserRole.ADMIN and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="User not found")

    return user
