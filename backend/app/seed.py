import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.entities import (
    Department, User, TaskCategory, Task, TaskAssignee,
    TaskBlocker, GitHubIntegration, GitHubTaskLink, GitHubCommit,
    GitHubPullRequest, CommitAnalysis, TaskEvidence, EvidenceDocument,
    Notification, ChatMessage
)
from app.models.enums import (
    UserRole, DepartmentType, TaskPriority, TaskStatus,
    VerificationType, VerificationStatus, NotificationType
)
from app.services.verification_engine import VerificationEngine

def seed_sample_chat_messages(db: Session):
    """Seed initial direct messages if none exist yet"""
    if db.query(ChatMessage).first():
        return
    
    users = {u.email: u for u in db.query(User).all()}
    sarah = users.get("sarah.chen@taskflow.dev")
    alex = users.get("alex.dev@taskflow.dev")
    priya = users.get("priya.ai@taskflow.dev")
    elena = users.get("elena.growth@taskflow.dev")
    marcus = users.get("marcus.vance@taskflow.dev")

    if not sarah or not alex:
        return

    now = datetime.now(timezone.utc)
    sample_msgs = [
        # Sarah & Alex (Engineering discussion)
        ChatMessage(
            sender_id=alex.id,
            receiver_id=sarah.id,
            channel="direct",
            message="Hey Sarah, I just pushed PR #42 for the OAuth2 Token Refresh. The verification heuristics score came out to 88/100!",
            created_at=now - timedelta(hours=3),
            is_read=True
        ),
        ChatMessage(
            sender_id=sarah.id,
            receiver_id=alex.id,
            channel="direct",
            message="Great work Alex! I reviewed the AST analysis and functional diff—looks rock solid. Approving shortly.",
            created_at=now - timedelta(hours=2, minutes=45),
            is_read=True
        ),
        # Sarah & Priya (AI Blocker)
        ChatMessage(
            sender_id=priya.id,
            receiver_id=sarah.id,
            channel="direct",
            message="Hi Sarah, we hit the quota limit on the A100 GPU cluster while fine-tuning the 8B model. Can we escalate the quota request?",
            created_at=now - timedelta(hours=1, minutes=30),
            is_read=False
        ),
        ChatMessage(
            sender_id=sarah.id,
            receiver_id=priya.id,
            channel="direct",
            message="Looking into the DevOps quota allocation now Priya, will ping you once the node pool expands.",
            created_at=now - timedelta(hours=1, minutes=10),
            is_read=True
        ),
        # Marcus & Elena (Marketing campaign)
        ChatMessage(
            sender_id=elena.id,
            receiver_id=marcus.id,
            channel="direct",
            message="Marcus, the Q4 Launch Asset bundle and PDF slide decks are uploaded and waiting for review on TaskFlow.",
            created_at=now - timedelta(hours=2),
            is_read=False
        ),
        ChatMessage(
            sender_id=marcus.id,
            receiver_id=elena.id,
            channel="direct",
            message="Thanks Elena! I'm reviewing the Figma mockups and copy deck now. Looks very crisp.",
            created_at=now - timedelta(minutes=40),
            is_read=True
        ),
        # Elena & Sarah (Cross-team query)
        ChatMessage(
            sender_id=elena.id,
            receiver_id=sarah.id,
            channel="direct",
            message="Hi Sarah! Do we have the target release dates confirmed for the telemetry dashboard feature so marketing can prepare announcements?",
            created_at=now - timedelta(minutes=25),
            is_read=False
        )
    ]
    db.add_all(sample_msgs)
    db.commit()
    print("[TaskFlow] Seeded sample chat messages!")

def init_seed_data(db: Session):
    # Check if already seeded
    if db.query(User).first():
        seed_sample_chat_messages(db)
        return

    print("[TaskFlow] Initializing database seed data...")

    # 1. Departments
    dept_eng = Department(
        name="Engineering",
        code="ENG",
        type=DepartmentType.TECHNICAL,
        description="Software development, platform infrastructure, and backend services."
    )
    dept_aiml = Department(
        name="AI & Machine Learning",
        code="AIML",
        type=DepartmentType.TECHNICAL,
        description="Computer vision, NLP pipelines, LLM fine-tuning, and model evaluation."
    )
    dept_mkt = Department(
        name="Marketing & Growth",
        code="MKT",
        type=DepartmentType.NON_TECHNICAL,
        description="Brand campaigns, product marketing, SEO, and content strategy."
    )
    dept_hr = Department(
        name="Human Resources",
        code="HR",
        type=DepartmentType.NON_TECHNICAL,
        description="Talent acquisition, employee onboarding, culture, and compliance."
    )
    dept_ops = Department(
        name="Operations",
        code="OPS",
        type=DepartmentType.NON_TECHNICAL,
        description="Business workflows, logistics, client support, and office coordination."
    )

    db.add_all([dept_eng, dept_aiml, dept_mkt, dept_hr, dept_ops])
    db.flush()

    # 2. Task Categories
    cat_feature = TaskCategory(
        department_id=dept_eng.id,
        name="Feature Implementation",
        default_verification_type=VerificationType.GITHUB_CODE,
        description="New API endpoints, frontend interfaces, or data pipelines."
    )
    cat_bug = TaskCategory(
        department_id=dept_eng.id,
        name="Bug Remediation",
        default_verification_type=VerificationType.GITHUB_CODE,
        description="Critical fixes, vulnerability patches, or performance bugs."
    )
    cat_model = TaskCategory(
        department_id=dept_aiml.id,
        name="Model Training & Evaluation",
        default_verification_type=VerificationType.GITHUB_CODE,
        description="Experimentation, hyperparameter tuning, and benchmark reports."
    )
    cat_campaign = TaskCategory(
        department_id=dept_mkt.id,
        name="Campaign Deliverable",
        default_verification_type=VerificationType.DOCUMENT_DELIVERABLE,
        description="Ad copy, social media asset bundles, launch collateral."
    )
    cat_onboard = TaskCategory(
        department_id=dept_hr.id,
        name="Employee Onboarding",
        default_verification_type=VerificationType.CHECKLIST,
        description="Compliance verification, handbook signoff, hardware provisioning."
    )

    db.add_all([cat_feature, cat_bug, cat_model, cat_campaign, cat_onboard])
    db.flush()

    # 3. Users
    user_admin = User(
        email="admin@taskflow.dev",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        role=UserRole.ADMIN,
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    user_mgr_tech = User(
        email="sarah.chen@taskflow.dev",
        hashed_password=get_password_hash("manager123"),
        full_name="Sarah Chen (Tech Lead / Manager)",
        role=UserRole.MANAGER,
        department_id=dept_eng.id,
        github_username="sarahchen-mgr",
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    )
    user_mgr_ops = User(
        email="marcus.vance@taskflow.dev",
        hashed_password=get_password_hash("manager123"),
        full_name="Marcus Vance (Operations Director)",
        role=UserRole.MANAGER,
        department_id=dept_ops.id,
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    )
    user_emp_alex = User(
        email="alex.dev@taskflow.dev",
        hashed_password=get_password_hash("emp123"),
        full_name="Alex Rivera",
        role=UserRole.EMPLOYEE,
        department_id=dept_eng.id,
        github_username="alex-rivera-dev",
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    )
    user_emp_priya = User(
        email="priya.ai@taskflow.dev",
        hashed_password=get_password_hash("emp123"),
        full_name="Priya Patel",
        role=UserRole.EMPLOYEE,
        department_id=dept_aiml.id,
        github_username="priya-ml-ai",
        avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
    )
    user_emp_elena = User(
        email="elena.growth@taskflow.dev",
        hashed_password=get_password_hash("emp123"),
        full_name="Elena Rostova",
        role=UserRole.EMPLOYEE,
        department_id=dept_mkt.id,
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    )

    db.add_all([user_admin, user_mgr_tech, user_mgr_ops, user_emp_alex, user_emp_priya, user_emp_elena])
    db.flush()

    # 4. GitHub Integration
    repo_eng = GitHubIntegration(
        repo_name="taskflow-org/core-platform",
        repo_url="https://github.com/taskflow-org/core-platform",
        webhook_secret=None
    )
    db.add(repo_eng)
    db.flush()

    now = datetime.now(timezone.utc)

    # 5. Sample Tasks
    # Task 1: Technical task under review with verified GitHub commits & PR
    task1 = Task(
        category_id=cat_feature.id,
        creator_id=user_mgr_tech.id,
        title="Implement OAuth2 Token Refresh & RBAC Middleware",
        description="Construct FastAPI security dependencies to decode JWT claims, enforce Admin/Manager roles, and invalidate expired refresh sessions.",
        priority=TaskPriority.HIGH,
        status=TaskStatus.UNDER_REVIEW,
        verification_type=VerificationType.GITHUB_CODE,
        acceptance_criteria=[
            {"id": "c1", "text": "JWT tokens correctly encrypted and validated with 24h expiration", "completed": True},
            {"id": "c2", "text": "Role enforcement middleware blocks unauthorized roles with 403 Forbidden", "completed": True},
            {"id": "c3", "text": "Pytest suite covers test_expired_token and test_invalid_role cases", "completed": True}
        ],
        deadline=now + timedelta(days=2),
        started_at=now - timedelta(days=2),
        submitted_at=now - timedelta(hours=3)
    )
    db.add(task1)
    db.flush()

    db.add(TaskAssignee(task_id=task1.id, user_id=user_emp_alex.id))

    # Task 1 GitHub activity
    link1 = GitHubTaskLink(
        task_id=task1.id,
        integration_id=repo_eng.id,
        branch_name="feature/ENG-102-auth-middleware",
        expected_pr_number=42
    )
    db.add(link1)
    db.flush()

    c1 = GitHubCommit(
        task_link_id=link1.id,
        commit_sha="a7b8c9d01234567890abcdef1234567890abcdef",
        commit_message="feat(auth): implement token decode and role hierarchy dependency",
        author_github_login="alex-rivera-dev",
        commit_timestamp=now - timedelta(days=1),
        additions=142,
        deletions=18,
        files_changed=4
    )
    db.add(c1)
    db.flush()

    analysis1 = VerificationEngine.analyze_commit_diff(
        commit_message=c1.commit_message,
        additions=c1.additions,
        deletions=c1.deletions,
        files_changed=c1.files_changed
    )
    db.add(CommitAnalysis(
        commit_id=c1.id,
        is_whitespace_only=analysis1["is_whitespace_only"],
        is_comment_only=analysis1["is_comment_only"],
        is_trivial_reformat=analysis1["is_trivial_reformat"],
        heuristic_significance_score=analysis1["heuristic_significance_score"],
        risk_flags=analysis1["risk_flags"]
    ))

    pr1 = GitHubPullRequest(
        task_link_id=link1.id,
        pr_number=42,
        title="feat(auth): Role-based access control and token validation",
        state="open",
        pr_url="https://github.com/taskflow-org/core-platform/pull/42",
        additions=142,
        deletions=18,
        changed_files=4
    )
    db.add(pr1)

    # Task 2: Blocked Technical Task
    task2 = Task(
        category_id=cat_model.id,
        creator_id=user_mgr_tech.id,
        title="Fine-tune Llama 3 8B on Internal Support Knowledge Base",
        description="Run LoRA fine-tuning script on 50,000 ticket logs to improve automated ticket classification accuracy above 92%.",
        priority=TaskPriority.URGENT,
        status=TaskStatus.BLOCKED,
        verification_type=VerificationType.GITHUB_CODE,
        acceptance_criteria=[
            {"id": "c1", "text": "Evaluation loss under 0.82 on validation split", "completed": False},
            {"id": "c2", "text": "Hugging Face model weights quantized to 4-bit GGUF", "completed": False}
        ],
        deadline=now + timedelta(days=1),
        started_at=now - timedelta(days=3)
    )
    db.add(task2)
    db.flush()

    db.add(TaskAssignee(task_id=task2.id, user_id=user_emp_priya.id))
    db.add(TaskBlocker(
        task_id=task2.id,
        reporter_id=user_emp_priya.id,
        reason="GPU cluster quota exceeded on Node 4; waiting on cloud credit top-up from DevOps."
    ))

    # Task 3: Non-technical Marketing Task with Document deliverables
    task3 = Task(
        category_id=cat_campaign.id,
        creator_id=user_mgr_ops.id,
        title="Q4 Product Launch Campaign Assets & Deck",
        description="Finalize the product messaging deck, one-pager datasheet, and social media scheduling copy for the upcoming Q4 rollout.",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.UNDER_REVIEW,
        verification_type=VerificationType.DOCUMENT_DELIVERABLE,
        acceptance_criteria=[
            {"id": "c1", "text": "Key executive summary slide deck in PDF format", "completed": True},
            {"id": "c2", "text": "Product feature matrix one-pager verified with sales engineering", "completed": True},
            {"id": "c3", "text": "Figma design link with all 12 ad creatives exported", "completed": True}
        ],
        deadline=now + timedelta(days=3),
        started_at=now - timedelta(days=4),
        submitted_at=now - timedelta(hours=6)
    )
    db.add(task3)
    db.flush()

    db.add(TaskAssignee(task_id=task3.id, user_id=user_emp_elena.id))

    evidence3 = TaskEvidence(
        task_id=task3.id,
        submitter_id=user_emp_elena.id,
        submission_notes="All campaign assets, presentation deck, and sales one-pagers have been uploaded and reviewed with the design team.",
        verification_status=VerificationStatus.PASSED_PRECHECK
    )
    db.add(evidence3)
    db.flush()

    db.add_all([
        EvidenceDocument(
            evidence_id=evidence3.id,
            title="TaskFlow_Q4_Launch_Deck_v2.pdf",
            file_type="pdf",
            file_url="https://storage.taskflow.dev/deliverables/launch_deck_v2.pdf",
            file_size_bytes=4850000
        ),
        EvidenceDocument(
            evidence_id=evidence3.id,
            title="Product One-Pager & Battlecard",
            file_type="link",
            file_url="https://figma.com/file/taskflow-marketing-deck-2026"
        )
    ])

    # Task 4: Completed task
    task4 = Task(
        category_id=cat_feature.id,
        creator_id=user_mgr_tech.id,
        title="PostgreSQL 16 Migration & Schema Optimization",
        description="Migrate connection pool to async engine and optimize foreign key indexes on task_assignees.",
        priority=TaskPriority.HIGH,
        status=TaskStatus.COMPLETED,
        verification_type=VerificationType.GITHUB_CODE,
        acceptance_criteria=[
            {"id": "c1", "text": "Zero downtime schema migration tested in staging", "completed": True}
        ],
        deadline=now - timedelta(days=1),
        started_at=now - timedelta(days=5),
        submitted_at=now - timedelta(days=2),
        completed_at=now - timedelta(days=1)
    )
    db.add(task4)
    db.flush()
    db.add(TaskAssignee(task_id=task4.id, user_id=user_emp_alex.id))

    # Notifications
    db.add_all([
        Notification(
            user_id=user_mgr_tech.id,
            task_id=task1.id,
            type=NotificationType.SUBMITTED_FOR_REVIEW,
            title="Submission Ready for Review",
            message="Alex Rivera has submitted 'Implement OAuth2 Token Refresh & RBAC Middleware' for verification.",
            is_read=False
        ),
        Notification(
            user_id=user_mgr_tech.id,
            task_id=task2.id,
            type=NotificationType.BLOCKER_RAISED,
            title="Blocker Alert",
            message="Priya Patel reported a blocker on task 'Fine-tune Llama 3 8B': GPU cluster quota exceeded.",
            is_read=False
        ),
        Notification(
            user_id=user_emp_alex.id,
            task_id=task1.id,
            type=NotificationType.TASK_ASSIGNED,
            title="Task Assigned",
            message="You were assigned to 'Implement OAuth2 Token Refresh & RBAC Middleware'.",
            is_read=True
        )
    ])

    db.commit()
    print("[TaskFlow] Database seeded successfully!")
