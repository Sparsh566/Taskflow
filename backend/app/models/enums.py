import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class DepartmentType(str, enum.Enum):
    TECHNICAL = "technical"
    NON_TECHNICAL = "non_technical"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    REJECTED = "rejected"

class VerificationType(str, enum.Enum):
    GITHUB_CODE = "github_code"
    DOCUMENT_DELIVERABLE = "document_deliverable"
    CHECKLIST = "checklist"
    EXTERNAL_LINK = "external_link"
    HYBRID = "hybrid"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    FLAGGED_INSIGNIFICANT = "flagged_insignificant"
    PASSED_PRECHECK = "passed_precheck"
    MANAGER_APPROVED = "manager_approved"
    MANAGER_REJECTED = "manager_rejected"

class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_STARTED = "task_started"
    BLOCKER_RAISED = "blocker_raised"
    DEADLINE_APPROACHING = "deadline_approaching"
    TASK_OVERDUE = "task_overdue"
    SUBMITTED_FOR_REVIEW = "submitted_for_review"
    TASK_APPROVED = "task_approved"
    TASK_REJECTED = "task_rejected"
