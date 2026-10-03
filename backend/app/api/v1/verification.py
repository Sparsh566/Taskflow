from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Task, TaskEvidence, EvidenceDocument, VerificationReview, User, Notification, ActivityLog
)
from app.models.enums import TaskStatus, VerificationStatus, UserRole, NotificationType
from app.schemas.api_schemas import (
    SubmitEvidenceRequest, TaskEvidenceRead,
    VerificationReviewCreate, VerificationReviewRead, TaskDisputeRequest
)
from app.api.deps import get_current_user, require_manager_or_admin
from app.services.verification_engine import VerificationEngine
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/tasks/{task_id}", tags=["Work Verification"])

@router.post("/submit-evidence", response_model=TaskEvidenceRead, status_code=status.HTTP_201_CREATED)
def submit_evidence(
    task_id: str,
    evidence_in: SubmitEvidenceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update criteria if provided
    if evidence_in.criteria_updates is not None:
        task.acceptance_criteria = [c.model_dump() for c in evidence_in.criteria_updates]

    evidence = TaskEvidence(
        task_id=task.id,
        submitter_id=current_user.id,
        submission_notes=evidence_in.submission_notes,
        verification_status=VerificationStatus.PASSED_PRECHECK
    )
    db.add(evidence)
    db.flush()

    for doc in evidence_in.documents:
        ev_doc = EvidenceDocument(
            evidence_id=evidence.id,
            title=doc.title,
            file_type=doc.file_type,
            file_url=doc.file_url,
            file_size_bytes=doc.file_size_bytes,
            checklist_answers=doc.checklist_answers
        )
        db.add(ev_doc)

    task.status = TaskStatus.UNDER_REVIEW
    task.submitted_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(evidence)

    NotificationService.notify_review_ready(db, task, current_user)
    return evidence

@router.get("/verification-summary")
def get_verification_summary(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    summary = VerificationEngine.evaluate_task_verification(db, task)
    return summary

@router.post("/review", response_model=VerificationReviewRead, status_code=status.HTTP_201_CREATED)
def review_task_submission(
    task_id: str,
    review_in: VerificationReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    summary = VerificationEngine.evaluate_task_verification(db, task)

    review = VerificationReview(
        task_id=task.id,
        evidence_id=review_in.evidence_id,
        reviewer_id=current_user.id,
        verdict=review_in.verdict,
        feedback_notes=review_in.feedback_notes,
        evaluated_github_metrics=summary,
        override_score=review_in.override_score,
        override_reason=review_in.override_reason
    )
    db.add(review)

    now = datetime.now(timezone.utc)
    if review_in.verdict == VerificationStatus.MANAGER_APPROVED:
        task.status = TaskStatus.COMPLETED
        task.completed_at = now
    else:
        task.status = TaskStatus.REJECTED

    task.updated_at = now

    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="review_submitted",
        entity_type="task",
        entity_id=task.id,
        action_metadata={
            "verdict": review_in.verdict.value,
            "has_override": bool(review_in.override_score is not None),
            "override_score": review_in.override_score
        }
    )
    db.add(log)

    db.commit()
    db.refresh(review)

    is_approved = (review_in.verdict == VerificationStatus.MANAGER_APPROVED)
    NotificationService.notify_review_result(db, task, current_user, is_approved, review_in.feedback_notes)
    return review

@router.post("/dispute", response_model=Dict[str, Any])
def dispute_task_score(
    task_id: str,
    dispute_in: TaskDisputeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    latest_review = db.query(VerificationReview).filter(
        VerificationReview.task_id == task_id
    ).order_by(VerificationReview.reviewed_at.desc()).first()

    now = datetime.now(timezone.utc)
    if latest_review:
        latest_review.is_disputed = True
        latest_review.dispute_reason = dispute_in.dispute_reason
        latest_review.disputed_at = now

    task.status = TaskStatus.UNDER_REVIEW
    task.updated_at = now

    # Create notification for managers / task creator
    target_reviewer_id = latest_review.reviewer_id if latest_review else task.creator_id
    notif = Notification(
        user_id=target_reviewer_id,
        task_id=task.id,
        type=NotificationType.TASK_DISPUTED,
        title="Task Score Disputed",
        message=f"{current_user.full_name} submitted a dispute for '{task.title}': \"{dispute_in.dispute_reason[:120]}\""
    )
    db.add(notif)

    # Activity log
    log = ActivityLog(
        user_id=current_user.id,
        action="score_disputed",
        entity_type="task",
        entity_id=task.id,
        action_metadata={
            "dispute_reason": dispute_in.dispute_reason,
            "evidence_url": dispute_in.additional_evidence_url
        }
    )
    db.add(log)

    db.commit()
    return {
        "success": True,
        "message": "Dispute recorded successfully. Task status moved to Under Review for managerial reassessment.",
        "task_id": task.id
    }
