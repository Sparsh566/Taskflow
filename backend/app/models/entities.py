import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import (
    UserRole, DepartmentType, TaskPriority, TaskStatus,
    VerificationType, VerificationStatus, NotificationType
)

def utcnow():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    type = Column(SQLEnum(DepartmentType), default=DepartmentType.TECHNICAL, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    users = relationship("User", back_populates="department")
    categories = relationship("TaskCategory", back_populates="department", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    github_username = Column(String(100), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    department = relationship("Department", back_populates="users")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    assigned_tasks = relationship("TaskAssignee", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class TaskCategory(Base):
    __tablename__ = "task_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    default_verification_type = Column(SQLEnum(VerificationType), default=VerificationType.DOCUMENT_DELIVERABLE, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    department = relationship("Department", back_populates="categories")
    tasks = relationship("Task", back_populates="category")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("task_categories.id", ondelete="SET NULL"), nullable=True)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    verification_type = Column(SQLEnum(VerificationType), default=VerificationType.DOCUMENT_DELIVERABLE, nullable=False)
    acceptance_criteria = Column(JSON, default=list, nullable=False) # List of dicts: [{"id": "1", "text": "...", "completed": False}]
    deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    category = relationship("TaskCategory", back_populates="tasks")
    assignees = relationship("TaskAssignee", back_populates="task", cascade="all, delete-orphan")
    blockers = relationship("TaskBlocker", back_populates="task", cascade="all, delete-orphan")
    github_link = relationship("GitHubTaskLink", uselist=False, back_populates="task", cascade="all, delete-orphan")
    evidence_submissions = relationship("TaskEvidence", back_populates="task", cascade="all, delete-orphan")
    reviews = relationship("VerificationReview", back_populates="task", cascade="all, delete-orphan")

class TaskAssignee(Base):
    __tablename__ = "task_assignees"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task = relationship("Task", back_populates="assignees")
    user = relationship("User", back_populates="assigned_tasks")

class TaskBlocker(Base):
    __tablename__ = "task_blockers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolver_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task = relationship("Task", back_populates="blockers")
    reporter = relationship("User", foreign_keys=[reporter_id])
    resolver = relationship("User", foreign_keys=[resolver_id])

class GitHubIntegration(Base):
    __tablename__ = "github_integrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    repo_name = Column(String(200), nullable=False) # e.g. "acme-corp/taskflow"
    repo_url = Column(String(500), nullable=False)
    access_token_encrypted = Column(Text, nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task_links = relationship("GitHubTaskLink", back_populates="integration", cascade="all, delete-orphan")

class GitHubTaskLink(Base):
    __tablename__ = "github_task_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), unique=True, nullable=False)
    integration_id = Column(String(36), ForeignKey("github_integrations.id", ondelete="CASCADE"), nullable=False)
    branch_name = Column(String(255), nullable=True)
    expected_pr_number = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task = relationship("Task", back_populates="github_link")
    integration = relationship("GitHubIntegration", back_populates="task_links")
    commits = relationship("GitHubCommit", back_populates="task_link", cascade="all, delete-orphan")
    pull_requests = relationship("GitHubPullRequest", back_populates="task_link", cascade="all, delete-orphan")

class GitHubCommit(Base):
    __tablename__ = "github_commits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_link_id = Column(String(36), ForeignKey("github_task_links.id", ondelete="CASCADE"), nullable=False)
    commit_sha = Column(String(40), unique=True, nullable=False)
    commit_message = Column(Text, nullable=False)
    author_github_login = Column(String(100), nullable=True)
    commit_timestamp = Column(DateTime(timezone=True), nullable=False)
    additions = Column(Integer, default=0, nullable=False)
    deletions = Column(Integer, default=0, nullable=False)
    files_changed = Column(Integer, default=0, nullable=False)
    raw_diff_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task_link = relationship("GitHubTaskLink", back_populates="commits")
    analysis = relationship("CommitAnalysis", uselist=False, back_populates="commit", cascade="all, delete-orphan")

class GitHubPullRequest(Base):
    __tablename__ = "github_pull_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_link_id = Column(String(36), ForeignKey("github_task_links.id", ondelete="CASCADE"), nullable=False)
    pr_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    state = Column(String(30), nullable=False) # open, closed, merged
    pr_url = Column(String(500), nullable=False)
    merged_at = Column(DateTime(timezone=True), nullable=True)
    additions = Column(Integer, default=0, nullable=False)
    deletions = Column(Integer, default=0, nullable=False)
    changed_files = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task_link = relationship("GitHubTaskLink", back_populates="pull_requests")

class CommitAnalysis(Base):
    __tablename__ = "commit_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    commit_id = Column(String(36), ForeignKey("github_commits.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_whitespace_only = Column(Boolean, default=False, nullable=False)
    is_comment_only = Column(Boolean, default=False, nullable=False)
    is_trivial_reformat = Column(Boolean, default=False, nullable=False)
    heuristic_significance_score = Column(Numeric(5, 2), default=100.00, nullable=False)
    risk_flags = Column(JSON, default=list, nullable=False) # e.g. ["repeated_commit_message"]
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    commit = relationship("GitHubCommit", back_populates="analysis")

class TaskEvidence(Base):
    __tablename__ = "task_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    submitter_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    submission_notes = Column(Text, nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.UNVERIFIED, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task = relationship("Task", back_populates="evidence_submissions")
    submitter = relationship("User", foreign_keys=[submitter_id])
    documents = relationship("EvidenceDocument", back_populates="evidence", cascade="all, delete-orphan")
    reviews = relationship("VerificationReview", back_populates="evidence")

class EvidenceDocument(Base):
    __tablename__ = "evidence_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evidence_id = Column(String(36), ForeignKey("task_evidence.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx, link, image, checklist
    file_url = Column(String(1000), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    checklist_answers = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    evidence = relationship("TaskEvidence", back_populates="documents")

class VerificationReview(Base):
    __tablename__ = "verification_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(String(36), ForeignKey("task_evidence.id", ondelete="SET NULL"), nullable=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    verdict = Column(SQLEnum(VerificationStatus), nullable=False) # manager_approved or manager_rejected
    feedback_notes = Column(Text, nullable=True)
    evaluated_github_metrics = Column(JSON, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    task = relationship("Task", back_populates="reviews")
    evidence = relationship("TaskEvidence", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
    task = relationship("Task")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "task_created", "status_changed"
    entity_type = Column(String(50), nullable=False, index=True) # task, evidence, github, user
    entity_id = Column(String(36), nullable=True, index=True)
    action_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id])

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    channel = Column(String(50), default="direct", nullable=False, index=True)
    message = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

