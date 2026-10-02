import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.entities import Workspace, WorkspaceMember, User, Task
from app.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceMemberAdd, WorkspaceMemberRead
from app.api.deps import get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Projects"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

def ensure_default_workspace(db: Session, current_user: User):
    """Ensure at least a default workspace exists"""
    ws = db.query(Workspace).first()
    if not ws:
        ws = Workspace(
            name="TaskFlow Core",
            slug="taskflow-core",
            description="Default core project workspace for team tasks, pull requests, and verified deliverables.",
            icon="🚀",
            repository_url="https://github.com/Sparsh566/Taskflow",
            owner_id=current_user.id
        )
        db.add(ws)
        db.flush()

        # Add all existing users as members
        users = db.query(User).all()
        for u in users:
            db.add(WorkspaceMember(
                workspace_id=ws.id,
                user_id=u.id,
                role="owner" if u.id == current_user.id else "member"
            ))

        # Assign existing unassigned tasks to this default workspace
        db.query(Task).filter(Task.workspace_id == None).update({"workspace_id": ws.id})
        db.commit()
    return ws

@router.get("", response_model=List[WorkspaceRead])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_default_workspace(db, current_user)
    workspaces = db.query(Workspace).order_by(Workspace.created_at.asc()).all()

    result = []
    for ws in workspaces:
        m_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id).count()
        t_count = db.query(Task).filter(Task.workspace_id == ws.id).count()
        ws_data = WorkspaceRead.model_validate(ws)
        ws_data.members_count = m_count
        ws_data.tasks_count = t_count
        result.append(ws_data)
    return result

@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(
    ws_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    base_slug = ws_in.slug or slugify(ws_in.name)
    slug = base_slug
    idx = 1
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base_slug}-{idx}"
        idx += 1

    ws = Workspace(
        name=ws_in.name.strip(),
        slug=slug,
        description=ws_in.description,
        icon=ws_in.icon or "🚀",
        repository_url=ws_in.repository_url,
        owner_id=current_user.id
    )
    db.add(ws)
    db.flush()

    # Automatically add current user as owner
    db.add(WorkspaceMember(
        workspace_id=ws.id,
        user_id=current_user.id,
        role="owner"
    ))
    db.commit()
    db.refresh(ws)

    ws_data = WorkspaceRead.model_validate(ws)
    ws_data.members_count = 1
    ws_data.tasks_count = 0
    return ws_data

@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    m_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id).count()
    t_count = db.query(Task).filter(Task.workspace_id == ws.id).count()
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id).all()

    ws_data = WorkspaceRead.model_validate(ws)
    ws_data.members_count = m_count
    ws_data.tasks_count = t_count
    ws_data.members = [WorkspaceMemberRead.model_validate(m) for m in members]
    return ws_data

@router.post("/{workspace_id}/members", response_model=WorkspaceMemberRead, status_code=status.HTTP_201_CREATED)
def add_workspace_member(
    workspace_id: str,
    member_in: WorkspaceMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    user = db.query(User).filter(User.id == member_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == member_in.user_id
    ).first()
    if existing:
        return WorkspaceMemberRead.model_validate(existing)

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=member_in.user_id,
        role=member_in.role or "member"
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return WorkspaceMemberRead.model_validate(member)

@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Don't delete if it's the only one
    count = db.query(Workspace).count()
    if count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only existing workspace")

    db.delete(ws)
    db.commit()
    return {"status": "success", "message": f"Workspace {ws.name} deleted"}
