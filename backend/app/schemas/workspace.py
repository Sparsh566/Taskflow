from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.api_schemas import UserRead

class WorkspaceBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: str = "🚀"
    repository_url: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceMemberRead(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    joined_at: datetime
    user: Optional[UserRead] = None

    class Config:
        from_attributes = True

class WorkspaceRead(WorkspaceBase):
    id: str
    slug: str
    owner_id: Optional[str] = None
    created_at: datetime
    members_count: int = 0
    tasks_count: int = 0
    members: Optional[List[WorkspaceMemberRead]] = None

    class Config:
        from_attributes = True

class WorkspaceMemberAdd(BaseModel):
    user_id: str
    role: str = "member"
