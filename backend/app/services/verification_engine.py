import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.entities import (
    Task, GitHubCommit, CommitAnalysis, GitHubTaskLink,
    TaskEvidence, EvidenceDocument, VerificationReview
)
from app.models.enums import VerificationStatus, VerificationType

class VerificationEngine:
    """
    Automated Work Verification Engine for technical (GitHub)
    and non-technical deliverables.
    """

    @staticmethod
    def analyze_commit_diff(
        commit_message: str,
        additions: int,
        deletions: int,
        files_changed: int,
        raw_diff_summary: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes a single commit's metrics and diff summary to flag
        insignificant work, trivial reformatting, or comment churn.
        """
        risk_flags: List[str] = []
        is_whitespace_only = False
        is_comment_only = False
        is_trivial_reformat = False
        score = 100.0

        # Heuristic 1: Trivial commit message
        lower_msg = commit_message.strip().lower()
        trivial_patterns = [r"^update$", r"^fix$", r"^wip$", r"^test$", r"^typo$", r"^\.$", r"^changes?$"]
        for pat in trivial_patterns:
            if re.match(pat, lower_msg):
                risk_flags.append("trivial_commit_message")
                score -= 15.0
                break

        # Heuristic 2: Zero or negligible code lines changed
        total_delta = additions + deletions
        if total_delta == 0:
            risk_flags.append("empty_commit")
            score = 10.0
            is_trivial_reformat = True
        elif total_delta <= 2:
            risk_flags.append("micro_change")
            score -= 10.0

        # Heuristic 3: Diff content inspection (if raw diff available)
        if raw_diff_summary:
            total_whitespace_lines = 0
            total_comment_lines = 0
            total_code_lines = 0

            for f in raw_diff_summary:
                patch = f.get("patch", "")
                if not patch:
                    continue
                for line in patch.split("\n"):
                    if line.startswith("+") and not line.startswith("+++"):
                        stripped = line[1:].strip()
                        if not stripped:
                            total_whitespace_lines += 1
                        elif stripped.startswith(("//", "#", "/*", "*", "<!--")):
                            total_comment_lines += 1
                        else:
                            total_code_lines += 1

            total_added = total_whitespace_lines + total_comment_lines + total_code_lines
            if total_added > 0:
                if total_whitespace_lines / total_added > 0.85:
                    is_whitespace_only = True
                    risk_flags.append("excessive_whitespace_churn")
                    score -= 40.0
                elif (total_whitespace_lines + total_comment_lines) / total_added > 0.85:
                    is_comment_only = True
                    risk_flags.append("predominantly_comment_changes")
                    score -= 25.0

        # Heuristic 4: Huge churn with equal adds and deletes (possible auto-formatter run)
        if additions > 50 and additions == deletions:
            is_trivial_reformat = True
            risk_flags.append("probable_autoformatter_churn")
            score -= 20.0

        final_score = max(5.0, min(100.0, score))
        return {
            "is_whitespace_only": is_whitespace_only,
            "is_comment_only": is_comment_only,
            "is_trivial_reformat": is_trivial_reformat,
            "heuristic_significance_score": round(final_score, 2),
            "risk_flags": risk_flags
        }

    @staticmethod
    def evaluate_task_verification(db: Session, task: Task) -> Dict[str, Any]:
        """
        Aggregates GitHub and Non-technical evidence for manager decision support.
        """
        technical_summary = {}
        non_technical_summary = {}
        flags = []
        overall_score = 100.0

        # Technical Evaluation
        if task.github_link:
            commits = task.github_link.commits
            prs = task.github_link.pull_requests
            
            total_commits = len(commits)
            total_additions = sum(c.additions for c in commits)
            total_deletions = sum(c.deletions for c in commits)
            total_files = sum(c.files_changed for c in commits)
            
            if total_commits == 0:
                flags.append("no_commits_recorded")
                overall_score -= 50.0
                avg_commit_score = 0.0
            else:
                commit_scores = []
                for c in commits:
                    if c.analysis:
                        commit_scores.append(float(c.analysis.heuristic_significance_score))
                        flags.extend(c.analysis.risk_flags)
                avg_commit_score = sum(commit_scores) / len(commit_scores) if commit_scores else 70.0
                overall_score = (overall_score + avg_commit_score) / 2.0

            technical_summary = {
                "branch_name": task.github_link.branch_name,
                "total_commits": total_commits,
                "total_additions": total_additions,
                "total_deletions": total_deletions,
                "total_files_changed": total_files,
                "pull_requests_count": len(prs),
                "prs_merged": len([p for p in prs if p.state == "merged"]),
                "avg_commit_significance_score": round(avg_commit_score, 2),
            }

        # Non-Technical Evaluation
        latest_evidence = task.evidence_submissions[-1] if task.evidence_submissions else None
        if latest_evidence:
            docs_count = len(latest_evidence.documents)
            checklist_items = 0
            checklist_completed = 0

            for doc in latest_evidence.documents:
                if doc.checklist_answers:
                    for k, val in doc.checklist_answers.items():
                        checklist_items += 1
                        if val is True:
                            checklist_completed += 1

            non_technical_summary = {
                "evidence_id": latest_evidence.id,
                "submission_notes": latest_evidence.submission_notes,
                "submitted_at": latest_evidence.created_at.isoformat() if latest_evidence.created_at else None,
                "documents_count": docs_count,
                "checklist_completed": checklist_completed,
                "checklist_total": checklist_items,
            }
        else:
            if task.verification_type in [VerificationType.DOCUMENT_DELIVERABLE, VerificationType.CHECKLIST]:
                flags.append("missing_evidence_submission")
                overall_score -= 40.0

        # Acceptance Criteria Checklist
        criteria = task.acceptance_criteria or []
        completed_criteria = [c for c in criteria if isinstance(c, dict) and c.get("completed", False)]
        criteria_completion_rate = (len(completed_criteria) / len(criteria)) if criteria else 1.0

        if criteria and criteria_completion_rate < 1.0:
            flags.append(f"acceptance_criteria_incomplete_{int(criteria_completion_rate*100)}pct")
            overall_score -= (1.0 - criteria_completion_rate) * 30.0

        final_score = max(0.0, min(100.0, round(overall_score, 2)))
        recommended_verdict = (
            VerificationStatus.PASSED_PRECHECK
            if final_score >= 60.0
            else VerificationStatus.FLAGGED_INSIGNIFICANT
        )

        return {
            "task_id": task.id,
            "verification_type": task.verification_type.value,
            "recommended_verdict": recommended_verdict.value,
            "overall_significance_score": final_score,
            "flags": list(set(flags)),
            "criteria_completion_rate": round(criteria_completion_rate * 100, 1),
            "technical_metrics": technical_summary,
            "deliverables_metrics": non_technical_summary,
        }
