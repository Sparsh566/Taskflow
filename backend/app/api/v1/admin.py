import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, engine
from app.core.security import get_password_hash
from app.api.deps import require_admin
from app.models.entities import (
    User, Department, Task, TaskAssignee, Workspace, ActivityLog,
    VerificationReview, TaskBlocker, Notification, ChatMessage
)
from app.models.enums import UserRole
from app.schemas.api_schemas import (
    UserCreate, UserRead, AdminUserUpdateRole,
    AdminUserUpdateStatus, AdminResetPassword
)

router = APIRouter(prefix="/admin", tags=["Admin Portal"], dependencies=[Depends(require_admin)])

@router.get("/users")
def get_all_users_admin(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        assigned_count = db.query(TaskAssignee).filter(TaskAssignee.user_id == u.id).count()
        dept_name = u.department.name if u.department else "Unassigned"
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "department_id": u.department_id,
            "department_name": dept_name,
            "github_username": u.github_username,
            "avatar_url": u.avatar_url,
            "is_active": u.is_active,
            "assigned_tasks_count": assigned_count,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return result

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user_admin(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    pwd = user_in.password if user_in.password else "taskflow2026"
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(pwd),
        role=user_in.role,
        department_id=user_in.department_id,
        github_username=user_in.github_username,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.email}",
        is_active=user_in.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log = ActivityLog(
        user_id=new_user.id,
        action="user_created_by_admin",
        entity_type="user",
        entity_id=new_user.id,
        action_metadata={"email": new_user.email, "role": new_user.role.value}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": f"User account created for {new_user.email}",
        "user_id": new_user.id
    }

@router.patch("/users/{user_id}/role")
def update_user_role_admin(
    user_id: str,
    payload: AdminUserUpdateRole,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = target.role.value if hasattr(target.role, "value") else str(target.role)
    target.role = payload.role
    target.updated_at = datetime.now(timezone.utc)

    log = ActivityLog(
        user_id=admin_user.id,
        action="role_updated",
        entity_type="user",
        entity_id=target.id,
        action_metadata={"old_role": old_role, "new_role": payload.role.value}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": f"Updated {target.email} role from {old_role} to {payload.role.value}",
        "user_id": target.id,
        "role": payload.role.value
    }

@router.patch("/users/{user_id}/status")
def update_user_status_admin(
    user_id: str,
    payload: AdminUserUpdateStatus,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == admin_user.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate the currently active administrator account")

    target.is_active = payload.is_active
    target.updated_at = datetime.now(timezone.utc)

    log = ActivityLog(
        user_id=admin_user.id,
        action="account_status_changed",
        entity_type="user",
        entity_id=target.id,
        action_metadata={"is_active": payload.is_active}
    )
    db.add(log)
    db.commit()

    status_str = "activated" if payload.is_active else "deactivated"
    return {
        "success": True,
        "message": f"Account {target.email} successfully {status_str}",
        "user_id": target.id,
        "is_active": target.is_active
    }

@router.post("/users/{user_id}/reset-password")
def reset_user_password_admin(
    user_id: str,
    payload: AdminResetPassword,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    target.hashed_password = get_password_hash(payload.new_password)
    target.updated_at = datetime.now(timezone.utc)

    log = ActivityLog(
        user_id=admin_user.id,
        action="password_reset_by_admin",
        entity_type="user",
        entity_id=target.id,
        action_metadata={"admin_id": admin_user.id}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": f"Password reset successfully for {target.email}"
    }

@router.get("/audit-logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    output = []
    for l in logs:
        user_email = l.user.email if l.user else "System"
        output.append({
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "actor_email": user_email,
            "metadata": l.action_metadata,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return output

@router.get("/db-health")
def get_database_health(db: Session = Depends(get_db)):
    """
    Diagnostics endpoint for cloud PostgreSQL (Supabase) vs SQLite,
    latency telemetry, and table record counts.
    """
    t0 = time.perf_counter()
    db.execute(text("SELECT 1"))
    t1 = time.perf_counter()
    latency_ms = round((t1 - t0) * 1000, 2)

    dialect = engine.dialect.name
    pool_info = {
        "dialect": dialect,
        "pool_type": engine.pool.__class__.__name__,
        "is_supabase_cloud": "postgres" in dialect
    }

    counts = {
        "users": db.query(User).count(),
        "tasks": db.query(Task).count(),
        "departments": db.query(Department).count(),
        "workspaces": db.query(Workspace).count(),
        "reviews": db.query(VerificationReview).count(),
        "activity_logs": db.query(ActivityLog).count(),
    }

    return {
        "status": "healthy",
        "latency_ms": latency_ms,
        "pool": pool_info,
        "record_counts": counts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/sandbox/reset")
def reset_sandbox(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    """
    Resets sandbox task data to default clean state for live demos.
    """
    # Delete ephemeral records
    db.query(ActivityLog).delete()
    db.query(Notification).delete()
    db.query(ChatMessage).delete()
    db.query(TaskBlocker).delete()
    db.query(VerificationReview).delete()
    db.commit()

    # Re-seed default messages and fresh telemetry
    from app.seed import seed_sample_chat_messages
    seed_sample_chat_messages(db)

    log = ActivityLog(
        user_id=admin_user.id,
        action="sandbox_reset",
        entity_type="system",
        action_metadata={"triggered_by": admin_user.email}
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Demo sandbox telemetry reset successfully to clean baseline."
    }
