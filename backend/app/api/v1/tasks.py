from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Task, TaskAssignee, TaskBlocker, User,
    GitHubIntegration, GitHubTaskLink
)
from app.models.enums import TaskStatus, TaskPriority, UserRole
from app.schemas.api_schemas import (
    TaskCreate, TaskRead, TaskUpdate, TaskStatusUpdate,
    TaskBlockerCreate, TaskBlockerRead
)
from app.api.deps import get_current_user, require_manager_or_admin
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def format_task_response(task: Task) -> TaskRead:
    now = datetime.now(timezone.utc)
    dl = task.deadline
    if dl and dl.tzinfo is None:
        dl = dl.replace(tzinfo=timezone.utc)
    is_overdue = (dl < now) and (task.status not in [TaskStatus.COMPLETED, TaskStatus.UNDER_REVIEW])
    task_data = TaskRead.model_validate(task)
    task_data.is_overdue = is_overdue
    return task_data

@router.get("", response_model=List[TaskRead])
def list_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    department_id: Optional[str] = None,
    assignee_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    only_my_tasks: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task)

    if workspace_id:
        query = query.filter(Task.workspace_id == workspace_id)

    if only_my_tasks or (current_user.role == UserRole.EMPLOYEE and not assignee_id):
        query = query.join(TaskAssignee).filter(TaskAssignee.user_id == current_user.id)
    elif assignee_id:
        query = query.join(TaskAssignee).filter(TaskAssignee.user_id == assignee_id)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if department_id:
        query = query.join(User, Task.creator_id == User.id).filter(User.department_id == department_id)

    tasks = query.order_by(Task.deadline.asc()).all()
    return [format_task_response(t) for t in tasks]

@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    task_data = task_in.model_dump(exclude={"assignee_ids", "github_repo", "branch_name"})
    task_data["acceptance_criteria"] = [c.model_dump() for c in task_in.acceptance_criteria]

    task = Task(
        **task_data,
        creator_id=current_user.id,
        status=TaskStatus.PENDING
    )
    db.add(task)
    db.flush()

    # Assign users
    if task_in.assignee_ids:
        for u_id in task_in.assignee_ids:
            assignee = TaskAssignee(task_id=task.id, user_id=u_id)
            db.add(assignee)

    # Optional GitHub link
    if task_in.github_repo:
        integration = db.query(GitHubIntegration).filter(
            GitHubIntegration.repo_name == task_in.github_repo
        ).first()
        if not integration:
            # Create a virtual integration record for this repo
            integration = GitHubIntegration(
                repo_name=task_in.github_repo,
                repo_url=f"https://github.com/{task_in.github_repo}"
            )
            db.add(integration)
            db.flush()

        task_link = GitHubTaskLink(
            task_id=task.id,
            integration_id=integration.id,
            branch_name=task_in.branch_name or f"task/{task.id[:8]}"
        )
        db.add(task_link)

    db.commit()
    db.refresh(task)

    # Send notifications
    if task_in.assignee_ids:
        NotificationService.notify_task_assignment(db, task, task_in.assignee_ids)

    return format_task_response(task)

@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return format_task_response(task)

@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True, exclude={"assignee_ids", "acceptance_criteria"})
    for field, val in update_data.items():
        setattr(task, field, val)

    if task_in.acceptance_criteria is not None:
        task.acceptance_criteria = [c.model_dump() for c in task_in.acceptance_criteria]

    if task_in.assignee_ids is not None:
        # replace assignees
        db.query(TaskAssignee).filter(TaskAssignee.task_id == task.id).delete()
        for u_id in task_in.assignee_ids:
            db.add(TaskAssignee(task_id=task.id, user_id=u_id))

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return format_task_response(task)

@router.patch("/{task_id}/status", response_model=TaskRead)
def update_task_status(
    task_id: str,
    status_update: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    now = datetime.now(timezone.utc)
    task.status = status_update.status
    if status_update.status == TaskStatus.IN_PROGRESS and not task.started_at:
        task.started_at = now
    elif status_update.status == TaskStatus.UNDER_REVIEW:
        task.submitted_at = now
    elif status_update.status == TaskStatus.COMPLETED:
        task.completed_at = now

    task.updated_at = now
    db.commit()
    db.refresh(task)
    return format_task_response(task)

@router.post("/{task_id}/blocker", response_model=TaskBlockerRead, status_code=status.HTTP_201_CREATED)
def report_blocker(
    task_id: str,
    blocker_in: TaskBlockerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    blocker = TaskBlocker(
        task_id=task.id,
        reporter_id=current_user.id,
        reason=blocker_in.reason
    )
    task.status = TaskStatus.BLOCKED
    task.updated_at = datetime.now(timezone.utc)
    db.add(blocker)
    db.commit()
    db.refresh(blocker)

    NotificationService.notify_blocker_raised(db, task, current_user, blocker_in.reason)
    return blocker

@router.patch("/{task_id}/blocker/{blocker_id}/resolve", response_model=TaskBlockerRead)
def resolve_blocker(
    task_id: str,
    blocker_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blocker = db.query(TaskBlocker).filter(
        TaskBlocker.id == blocker_id, TaskBlocker.task_id == task_id
    ).first()
    if not blocker:
        raise HTTPException(status_code=404, detail="Blocker not found")

    blocker.is_resolved = True
    blocker.resolved_at = datetime.now(timezone.utc)
    blocker.resolver_id = current_user.id

    task = db.query(Task).filter(Task.id == task_id).first()
    # Check if there are other unresolved blockers
    other_blockers = db.query(TaskBlocker).filter(
        TaskBlocker.task_id == task_id,
        TaskBlocker.id != blocker_id,
        TaskBlocker.is_resolved == False
    ).count()
    if other_blockers == 0:
        task.status = TaskStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(blocker)
    return blocker
