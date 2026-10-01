from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.entities import Task, TaskAssignee, User, Department, VerificationReview
from app.models.enums import TaskStatus, VerificationStatus, UserRole
from app.schemas.api_schemas import ManagerDashboardMetrics
from app.api.deps import get_current_user, require_manager_or_admin

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/dashboard", response_model=ManagerDashboardMetrics)
def get_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    now = datetime.now(timezone.utc)
    tasks = db.query(Task).all()

    total_tasks = len(tasks)
    pending_tasks = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
    in_progress_tasks = sum(1 for t in tasks if t.status == TaskStatus.IN_PROGRESS)
    blocked_tasks = sum(1 for t in tasks if t.status == TaskStatus.BLOCKED)
    under_review_tasks = sum(1 for t in tasks if t.status == TaskStatus.UNDER_REVIEW)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    def check_overdue(t):
        if not t.deadline:
            return False
        dl = t.deadline if t.deadline.tzinfo else t.deadline.replace(tzinfo=timezone.utc)
        return dl < now and t.status not in [TaskStatus.COMPLETED, TaskStatus.UNDER_REVIEW]

    overdue_tasks = sum(1 for t in tasks if check_overdue(t))

    # Verification reviews approval rate
    total_reviews = db.query(VerificationReview).count()
    approved_reviews = db.query(VerificationReview).filter(
        VerificationReview.verdict == VerificationStatus.MANAGER_APPROVED
    ).count()
    approval_rate = (approved_reviews / total_reviews * 100.0) if total_reviews > 0 else 100.0

    # Employee workload
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
    workload_data = []
    for emp in employees:
        assigned_count = db.query(TaskAssignee).filter(TaskAssignee.user_id == emp.id).count()
        in_prog = (
            db.query(TaskAssignee)
            .join(Task)
            .filter(TaskAssignee.user_id == emp.id, Task.status == TaskStatus.IN_PROGRESS)
            .count()
        )
        completed = (
            db.query(TaskAssignee)
            .join(Task)
            .filter(TaskAssignee.user_id == emp.id, Task.status == TaskStatus.COMPLETED)
            .count()
        )
        workload_data.append({
            "user_id": emp.id,
            "full_name": emp.full_name,
            "email": emp.email,
            "department": emp.department.name if emp.department else "Unassigned",
            "assigned_tasks": assigned_count,
            "in_progress_tasks": in_prog,
            "completed_tasks": completed
        })

    # Department distribution
    departments = db.query(Department).all()
    dept_distribution = []
    for d in departments:
        # count tasks in this department
        d_tasks = (
            db.query(Task)
            .join(User, Task.creator_id == User.id)
            .filter(User.department_id == d.id)
            .count()
        )
        dept_distribution.append({
            "department_id": d.id,
            "department_name": d.name,
            "code": d.code,
            "task_count": d_tasks
        })

    # Recent activities
    recent_activity = [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status.value,
            "priority": t.priority.value,
            "updated_at": t.updated_at.isoformat() if t.updated_at else t.created_at.isoformat(),
        }
        for t in sorted(tasks, key=lambda x: x.updated_at or x.created_at, reverse=True)[:6]
    ]

    return ManagerDashboardMetrics(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        blocked_tasks=blocked_tasks,
        under_review_tasks=under_review_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        verification_approval_rate=round(approval_rate, 1),
        workload_by_employee=workload_data,
        department_distribution=dept_distribution,
        recent_activity=recent_activity
    )
