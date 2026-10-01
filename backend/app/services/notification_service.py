from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.entities import Notification, Task, User
from app.models.enums import NotificationType

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notif_type: NotificationType,
        title: str,
        message: str,
        task_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            task_id=task_id,
            type=notif_type,
            title=title,
            message=message
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def notify_task_assignment(db: Session, task: Task, assignee_ids: List[str]):
        for user_id in assignee_ids:
            NotificationService.create_notification(
                db=db,
                user_id=user_id,
                notif_type=NotificationType.TASK_ASSIGNED,
                title="New Task Assigned",
                message=f"You have been assigned to task: '{task.title}'. Deadline: {task.deadline.strftime('%b %d, %Y')}",
                task_id=task.id
            )

    @staticmethod
    def notify_blocker_raised(db: Session, task: Task, reporter: User, reason: str):
        # Notify task creator / manager
        NotificationService.create_notification(
            db=db,
            user_id=task.creator_id,
            notif_type=NotificationType.BLOCKER_RAISED,
            title=f"Blocker Raised on Task: {task.title}",
            message=f"{reporter.full_name} reported a blocker: '{reason}'",
            task_id=task.id
        )

    @staticmethod
    def notify_review_ready(db: Session, task: Task, submitter: User):
        NotificationService.create_notification(
            db=db,
            user_id=task.creator_id,
            notif_type=NotificationType.SUBMITTED_FOR_REVIEW,
            title=f"Submission Ready for Review: {task.title}",
            message=f"{submitter.full_name} has submitted work deliverables for verification.",
            task_id=task.id
        )

    @staticmethod
    def notify_review_result(db: Session, task: Task, reviewer: User, is_approved: bool, feedback: Optional[str]):
        notif_type = NotificationType.TASK_APPROVED if is_approved else NotificationType.TASK_REJECTED
        title = f"Task {'Approved' if is_approved else 'Returned for Revision'}: {task.title}"
        msg = f"Reviewed by {reviewer.full_name}. " + (f"Feedback: {feedback}" if feedback else "")
        for assignee in task.assignees:
            NotificationService.create_notification(
                db=db,
                user_id=assignee.user_id,
                notif_type=notif_type,
                title=title,
                message=msg,
                task_id=task.id
            )
