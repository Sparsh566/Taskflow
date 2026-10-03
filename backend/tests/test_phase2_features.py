import unittest
from unittest.mock import MagicMock
from app.services.verification_engine import VerificationEngine
from app.models.enums import VerificationType, VerificationStatus, UserRole
from app.models.entities import Task, TaskEvidence, GitHubTaskLink, GitHubPullRequest

class TestPhase2VerificationEnhancements(unittest.TestCase):
    def test_multi_signals_present_in_evaluation(self):
        task = MagicMock(spec=Task)
        task.id = "task-multi-signal-1"
        task.title = "Implement Secure Session Gate"
        task.verification_type = VerificationType.GITHUB_CODE
        task.acceptance_criteria = [
            {"id": "1", "text": "Tokens stored in localStorage", "completed": True},
            {"id": "2", "text": "Auth gate redirects on 401", "completed": True}
        ]
        task.evidence_submissions = []

        pr = MagicMock(spec=GitHubPullRequest)
        pr.state = "merged"
        task_link = MagicMock(spec=GitHubTaskLink)
        task_link.commits = []
        task_link.pull_requests = [pr]
        task.github_link = task_link

        db = MagicMock()
        summary = VerificationEngine.evaluate_task_verification(db, task)

        self.assertIn("multi_signals", summary)
        self.assertIn("ci_status", summary["multi_signals"])
        self.assertIn("pr_review_status", summary["multi_signals"])
        self.assertIn("pr_merge_status", summary["multi_signals"])
        self.assertTrue(summary["multi_signals"]["is_merged"])
        self.assertEqual(summary["multi_signals"]["pr_merge_status"], "merged")

    def test_ai_advisory_generation(self):
        task = MagicMock(spec=Task)
        task.id = "task-ai-1"
        task.title = "Refactor Telemetry Service"
        task.verification_type = VerificationType.GITHUB_CODE
        task.acceptance_criteria = [
            {"id": "1", "text": "Migrate queries", "completed": True}
        ]
        task.evidence_submissions = []
        task.github_link = None

        db = MagicMock()
        summary = VerificationEngine.evaluate_task_verification(db, task)

        self.assertIn("ai_advisory", summary)
        ai = summary["ai_advisory"]
        self.assertIn("confidence", ai)
        self.assertIn("verdict_suggestion", ai)
        self.assertIn("summary", ai)
        self.assertIn("strengths", ai)
        self.assertIn("disclaimer", ai)

    def test_ai_advisory_cautions_for_unverified_items(self):
        task = MagicMock(spec=Task)
        task.id = "task-ai-incomplete"
        task.title = "Draft Marketing Strategy"
        task.verification_type = VerificationType.DOCUMENT_DELIVERABLE
        task.acceptance_criteria = [
            {"id": "1", "text": "Slide deck attached", "completed": False}
        ]
        task.evidence_submissions = []
        task.github_link = None

        db = MagicMock()
        summary = VerificationEngine.evaluate_task_verification(db, task)

        ai = summary["ai_advisory"]
        self.assertTrue(len(ai["cautions"]) > 0)
        self.assertTrue(any("document" in c or "unmarked" in c for c in ai["cautions"]))
