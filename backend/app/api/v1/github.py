import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    GitHubIntegration, GitHubTaskLink, GitHubCommit,
    GitHubPullRequest, CommitAnalysis, Task, User
)
from app.schemas.api_schemas import (
    GitHubIntegrationCreate, GitHubIntegrationRead,
    GitHubCommitRead, GitHubPullRequestRead
)
from app.api.deps import get_current_user, require_admin
from app.services.verification_engine import VerificationEngine

router = APIRouter(prefix="/github", tags=["GitHub Integration"])

@router.get("/integrations", response_model=List[GitHubIntegrationRead])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(GitHubIntegration).filter(GitHubIntegration.is_active == True).all()

@router.post("/integrations", response_model=GitHubIntegrationRead, status_code=status.HTTP_201_CREATED)
def create_integration(
    integ_in: GitHubIntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(GitHubIntegration).filter(GitHubIntegration.repo_name == integ_in.repo_name).first()
    if existing:
        return existing

    integ = GitHubIntegration(
        repo_name=integ_in.repo_name,
        repo_url=integ_in.repo_url,
        webhook_secret=integ_in.webhook_secret
    )
    db.add(integ)
    db.commit()
    db.refresh(integ)
    return integ

@router.post("/sync-commits/{task_id}")
def sync_task_commits(
    task_id: str,
    commits_data: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests commits for a task (from webhook or mock commit simulator)
    and computes heuristic significance analysis on each commit.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.github_link:
        # Auto-create link if repo provided
        integration = db.query(GitHubIntegration).first()
        if not integration:
            integration = GitHubIntegration(
                repo_name="taskflow-org/core-engine",
                repo_url="https://github.com/taskflow-org/core-engine"
            )
            db.add(integration)
            db.flush()
        task_link = GitHubTaskLink(
            task_id=task.id,
            integration_id=integration.id,
            branch_name=f"feat/task-{task.id[:6]}"
        )
        db.add(task_link)
        db.flush()
    else:
        task_link = task.github_link

    saved_commits = []
    for c_data in commits_data:
        sha = c_data.get("commit_sha") or f"sha-{uuid.uuid4().hex[:10]}"
        msg = c_data.get("commit_message", "commit update")
        additions = int(c_data.get("additions", 10))
        deletions = int(c_data.get("deletions", 2))
        files_changed = int(c_data.get("files_changed", 1))
        diff_summary = c_data.get("raw_diff_summary")

        # Run heuristic analysis
        analysis_result = VerificationEngine.analyze_commit_diff(
            commit_message=msg,
            additions=additions,
            deletions=deletions,
            files_changed=files_changed,
            raw_diff_summary=diff_summary
        )

        commit = GitHubCommit(
            task_link_id=task_link.id,
            commit_sha=sha,
            commit_message=msg,
            author_github_login=c_data.get("author_github_login", current_user.github_username or "developer"),
            commit_timestamp=datetime.now(timezone.utc),
            additions=additions,
            deletions=deletions,
            files_changed=files_changed,
            raw_diff_summary=diff_summary
        )
        db.add(commit)
        db.flush()

        analysis = CommitAnalysis(
            commit_id=commit.id,
            is_whitespace_only=analysis_result["is_whitespace_only"],
            is_comment_only=analysis_result["is_comment_only"],
            is_trivial_reformat=analysis_result["is_trivial_reformat"],
            heuristic_significance_score=analysis_result["heuristic_significance_score"],
            risk_flags=analysis_result["risk_flags"],
            explanation=analysis_result.get("explanation"),
            score_breakdown=analysis_result.get("score_breakdown")
        )
        db.add(analysis)
        saved_commits.append(commit.id)

    db.commit()
    return {"status": "success", "commits_processed": len(saved_commits)}

@router.post("/webhook")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook handler for GitHub push and pull_request events.
    """
    event = request.headers.get("X-GitHub-Event", "push")
    payload = await request.json()

    # Process payload and extract branch/task matches
    return {"message": "Webhook received", "event": event}
