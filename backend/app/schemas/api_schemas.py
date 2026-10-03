from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import (
    UserRole, DepartmentType, TaskPriority, TaskStatus,
    VerificationType, VerificationStatus, NotificationType
)

# --- Authentication & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PersonaSwitchRequest(BaseModel):
    email: EmailStr

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class MasterVaultLoginRequest(BaseModel):
    admin_id: str
    master_key: str
    access_passcode: Optional[str] = None


class DepartmentBase(BaseModel):
    name: str
    code: str
    type: DepartmentType = DepartmentType.TECHNICAL
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentRead(DepartmentBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    department_id: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: Optional[str] = "emp123"
    workspace_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department_id: Optional[str] = None
    role: Optional[UserRole] = None
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class UserRead(UserBase):
    id: str
    created_at: datetime
    department: Optional[DepartmentRead] = None
    class Config:
        from_attributes = True

Token.model_rebuild()

# --- Task Category Schemas ---
class TaskCategoryBase(BaseModel):
    name: str
    department_id: str
    default_verification_type: VerificationType = VerificationType.DOCUMENT_DELIVERABLE
    description: Optional[str] = None

class TaskCategoryCreate(TaskCategoryBase):
    pass

class TaskCategoryRead(TaskCategoryBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Task Schemas ---
class AcceptanceCriterion(BaseModel):
    id: str
    text: str
    completed: bool = False

class TaskBase(BaseModel):
    title: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    verification_type: VerificationType = VerificationType.DOCUMENT_DELIVERABLE
    acceptance_criteria: List[AcceptanceCriterion] = Field(default_factory=list)
    deadline: datetime
    category_id: Optional[str] = None
    workspace_id: Optional[str] = None

class TaskCreate(TaskBase):
    assignee_ids: List[str] = Field(default_factory=list)
    github_repo: Optional[str] = None
    branch_name: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    verification_type: Optional[VerificationType] = None
    acceptance_criteria: Optional[List[AcceptanceCriterion]] = None
    deadline: Optional[datetime] = None
    category_id: Optional[str] = None
    assignee_ids: Optional[List[str]] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    notes: Optional[str] = None

class TaskBlockerCreate(BaseModel):
    reason: str

class TaskBlockerRead(BaseModel):
    id: str
    task_id: str
    reporter_id: str
    reason: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolver_id: Optional[str] = None
    reporter: Optional[UserRead] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- GitHub Schemas ---
class GitHubCommitAnalysisRead(BaseModel):
    is_whitespace_only: bool
    is_comment_only: bool
    is_trivial_reformat: bool
    heuristic_significance_score: float
    risk_flags: List[str]
    explanation: Optional[str] = None
    score_breakdown: Optional[List[Dict[str, Any]]] = None
    class Config:
        from_attributes = True

class GitHubCommitRead(BaseModel):
    id: str
    commit_sha: str
    commit_message: str
    author_github_login: Optional[str] = None
    commit_timestamp: datetime
    additions: int
    deletions: int
    files_changed: int
    analysis: Optional[GitHubCommitAnalysisRead] = None
    class Config:
        from_attributes = True

class GitHubPullRequestRead(BaseModel):
    id: str
    pr_number: int
    title: str
    state: str
    pr_url: str
    merged_at: Optional[datetime] = None
    additions: int
    deletions: int
    changed_files: int
    class Config:
        from_attributes = True

class GitHubTaskLinkRead(BaseModel):
    id: str
    task_id: str
    integration_id: str
    branch_name: Optional[str] = None
    expected_pr_number: Optional[int] = None
    commits: List[GitHubCommitRead] = Field(default_factory=list)
    pull_requests: List[GitHubPullRequestRead] = Field(default_factory=list)
    class Config:
        from_attributes = True

class GitHubIntegrationCreate(BaseModel):
    repo_name: str
    repo_url: str
    access_token: Optional[str] = None
    webhook_secret: Optional[str] = None

class GitHubIntegrationRead(BaseModel):
    id: str
    repo_name: str
    repo_url: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- Evidence & Non-Technical Verification ---
class DocumentItem(BaseModel):
    title: str
    file_type: str # pdf, docx, link, image, checklist
    file_url: str
    file_size_bytes: Optional[int] = None
    checklist_answers: Optional[Dict[str, Any]] = None

class SubmitEvidenceRequest(BaseModel):
    submission_notes: Optional[str] = None
    documents: List[DocumentItem] = Field(default_factory=list)
    criteria_updates: Optional[List[AcceptanceCriterion]] = None

class EvidenceDocumentRead(DocumentItem):
    id: str
    evidence_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class TaskEvidenceRead(BaseModel):
    id: str
    task_id: str
    submitter_id: str
    submission_notes: Optional[str] = None
    verification_status: VerificationStatus
    submitter: Optional[UserRead] = None
    documents: List[EvidenceDocumentRead] = Field(default_factory=list)
    created_at: datetime
    class Config:
        from_attributes = True

# --- Verification Reviews ---
class VerificationReviewCreate(BaseModel):
    verdict: VerificationStatus # manager_approved or manager_rejected
    feedback_notes: Optional[str] = None
    evidence_id: Optional[str] = None
    override_score: Optional[float] = None
    override_reason: Optional[str] = None

class VerificationReviewRead(BaseModel):
    id: str
    task_id: str
    reviewer_id: str
    verdict: VerificationStatus
    feedback_notes: Optional[str] = None
    evaluated_github_metrics: Optional[Dict[str, Any]] = None
    override_score: Optional[float] = None
    override_reason: Optional[str] = None
    is_disputed: bool = False
    dispute_reason: Optional[str] = None
    disputed_at: Optional[datetime] = None
    reviewer: Optional[UserRead] = None
    reviewed_at: datetime
    class Config:
        from_attributes = True

class TaskDisputeRequest(BaseModel):
    dispute_reason: str
    additional_evidence_url: Optional[str] = None

class AdminUserUpdateRole(BaseModel):
    role: UserRole

class AdminUserUpdateStatus(BaseModel):
    is_active: bool

class AdminResetPassword(BaseModel):
    new_password: str

# --- Full Task Read with Relations ---
class TaskAssigneeRead(BaseModel):
    id: str
    user_id: str
    assigned_at: datetime
    user: UserRead
    class Config:
        from_attributes = True

class TaskRead(TaskBase):
    id: str
    creator_id: str
    status: TaskStatus
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserRead] = None
    category: Optional[TaskCategoryRead] = None
    assignees: List[TaskAssigneeRead] = Field(default_factory=list)
    blockers: List[TaskBlockerRead] = Field(default_factory=list)
    github_link: Optional[GitHubTaskLinkRead] = None
    evidence_submissions: List[TaskEvidenceRead] = Field(default_factory=list)
    reviews: List[VerificationReviewRead] = Field(default_factory=list)
    is_overdue: bool = False

    class Config:
        from_attributes = True

# --- Notifications ---
class NotificationRead(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Analytics & Dashboard ---
class ManagerDashboardMetrics(BaseModel):
    total_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    under_review_tasks: int
    completed_tasks: int
    overdue_tasks: int
    verification_approval_rate: float
    workload_by_employee: List[Dict[str, Any]]
    department_distribution: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
