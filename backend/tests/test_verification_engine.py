import unittest
from unittest.mock import MagicMock
from app.services.verification_engine import VerificationEngine
from app.models.enums import VerificationType, VerificationStatus


class TestVerificationEngineCommitDiff(unittest.TestCase):
    """
    Unit test suite for VerificationEngine.analyze_commit_diff heuristics.
    """

    def test_clean_functional_commit_scores_high(self):
        """A clean commit with functional logic, good message, and additions scores 100."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="feat(auth): add OAuth2 provider authentication flow",
            additions=85,
            deletions=12,
            files_changed=3,
            raw_diff_summary=[{
                "patch": "@@ -1,5 +1,15 @@\n+def authenticate_user(token):\n+    user = verify_jwt(token)\n+    return user\n"
            }]
        )
        self.assertEqual(res["heuristic_significance_score"], 100.0)
        self.assertEqual(len(res["risk_flags"]), 0)
        self.assertFalse(res["is_whitespace_only"])
        self.assertFalse(res["is_comment_only"])
        self.assertFalse(res["is_trivial_reformat"])
        self.assertIn("score_breakdown", res)
        self.assertIn("explanation", res)

    def test_empty_commit_penalized(self):
        """Zero additions and deletions must be heavily penalized and flagged as empty_commit."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="feat: empty touch commit",
            additions=0,
            deletions=0,
            files_changed=0
        )
        self.assertEqual(res["heuristic_significance_score"], 10.0)
        self.assertIn("empty_commit", res["risk_flags"])
        self.assertTrue(res["is_trivial_reformat"])
        deltas = [b["delta"] for b in res["score_breakdown"] if b["category"] == "penalty"]
        self.assertIn(-90.0, deltas)

    def test_micro_change_delta_penalized(self):
        """Delta of 1 or 2 lines is flagged as micro_change."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="chore: update variable name",
            additions=1,
            deletions=1,
            files_changed=1
        )
        self.assertEqual(res["heuristic_significance_score"], 90.0)
        self.assertIn("micro_change", res["risk_flags"])

    def test_trivial_commit_messages_penalized(self):
        """Trivial messages like 'update', 'fix', 'wip', 'test', 'typo' are penalized 15 pts."""
        trivial_msgs = ["update", "Update", "FIX", "wip", "test", "typo", ".", "changes"]
        for msg in trivial_msgs:
            res = VerificationEngine.analyze_commit_diff(
                commit_message=msg,
                additions=25,
                deletions=5,
                files_changed=2
            )
            self.assertEqual(res["heuristic_significance_score"], 85.0, f"Failed for '{msg}'")
            self.assertIn("trivial_commit_message", res["risk_flags"])

    def test_meaningful_commit_message_retains_score(self):
        """Descriptive messages do not receive trivial message deduction."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="refactor(database): optimize pool connection timeouts",
            additions=30,
            deletions=10,
            files_changed=2
        )
        self.assertNotIn("trivial_commit_message", res["risk_flags"])
        self.assertGreaterEqual(res["heuristic_significance_score"], 95.0)

    def test_excessive_whitespace_churn_penalized(self):
        """Patches where >85% of lines are blank spaces are flagged and penalized 40 pts."""
        patch_lines = ["@@ -1,5 +1,15 @@"] + ["+   "] * 9 + ["+x = 1"]
        res = VerificationEngine.analyze_commit_diff(
            commit_message="style: adjust indentation",
            additions=10,
            deletions=0,
            files_changed=1,
            raw_diff_summary=[{"patch": "\n".join(patch_lines)}]
        )
        self.assertTrue(res["is_whitespace_only"])
        self.assertIn("excessive_whitespace_churn", res["risk_flags"])
        self.assertLessEqual(res["heuristic_significance_score"], 60.0)

    def test_predominantly_comment_changes_penalized(self):
        """Patches where comments dominate (>85%) are penalized 25 pts."""
        patch_lines = ["@@ -1,5 +1,15 @@"] + ["+# comment documentation line"] * 9 + ["+value = 42"]
        res = VerificationEngine.analyze_commit_diff(
            commit_message="docs: add module commentary",
            additions=10,
            deletions=0,
            files_changed=1,
            raw_diff_summary=[{"patch": "\n".join(patch_lines)}]
        )
        self.assertTrue(res["is_comment_only"])
        self.assertIn("predominantly_comment_changes", res["risk_flags"])
        self.assertLessEqual(res["heuristic_significance_score"], 75.0)

    def test_balanced_autoformatter_churn_penalized(self):
        """Large symmetric additions and deletions (equal churn > 50) indicate autoformatter."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="chore: run prettier formatter",
            additions=150,
            deletions=150,
            files_changed=8
        )
        self.assertTrue(res["is_trivial_reformat"])
        self.assertIn("probable_autoformatter_churn", res["risk_flags"])
        self.assertEqual(res["heuristic_significance_score"], 80.0)

    def test_score_lower_bound_clamping(self):
        """Cumulative severe penalties must not drive score below 5.0 minimum floor."""
        patch_lines = ["@@ -1,5 +1,15 @@"] + ["+   "] * 20
        res = VerificationEngine.analyze_commit_diff(
            commit_message="update",  # -15
            additions=0,
            deletions=0,              # -90 => score 10.0 - 15 = -5 => clamped to 5.0
            files_changed=1,
            raw_diff_summary=[{"patch": "\n".join(patch_lines)}]
        )
        self.assertGreaterEqual(res["heuristic_significance_score"], 5.0)

    def test_score_upper_bound_clamping(self):
        """Score must never exceed 100.0."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="feat(core): implement high-value algorithmic solver",
            additions=500,
            deletions=50,
            files_changed=5
        )
        self.assertLessEqual(res["heuristic_significance_score"], 100.0)

    def test_commit_explanation_and_breakdown_structure(self):
        """Check presence and structure of score_breakdown and human-readable explanation."""
        res = VerificationEngine.analyze_commit_diff(
            commit_message="fix",
            additions=1,
            deletions=0,
            files_changed=1
        )
        self.assertIsInstance(res["score_breakdown"], list)
        self.assertIsInstance(res["explanation"], str)
        for entry in res["score_breakdown"]:
            self.assertIn("factor", entry)
            self.assertIn("delta", entry)
            self.assertIn("category", entry)
            self.assertIn("detail", entry)


class TestVerificationEngineTaskEvaluation(unittest.TestCase):
    """
    Unit test suite for VerificationEngine.evaluate_task_verification.
    """

    def setUp(self):
        self.db = MagicMock()

    def _create_mock_task(self, verification_type=VerificationType.GITHUB_CODE, criteria=None):
        task = MagicMock()
        task.id = "task-uuid-123"
        task.verification_type = verification_type
        task.acceptance_criteria = criteria or []
        task.github_link = None
        task.evidence_submissions = []
        return task

    def test_task_technical_no_commits_penalized(self):
        """Technical task with 0 commits receives a 50 pt penalty and flag."""
        task = self._create_mock_task(verification_type=VerificationType.GITHUB_CODE)
        link = MagicMock()
        link.branch_name = "feat/task-123"
        link.commits = []
        link.pull_requests = []
        task.github_link = link

        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["overall_significance_score"], 50.0)
        self.assertIn("no_commits_recorded", result["flags"])
        self.assertEqual(result["recommended_verdict"], VerificationStatus.FLAGGED_INSIGNIFICANT.value)
        self.assertIn("Missing GitHub Commits", [b["factor"] for b in result["score_breakdown"]])

    def test_task_technical_with_verified_commits(self):
        """Technical task with high quality commits achieves high score."""
        task = self._create_mock_task(verification_type=VerificationType.GITHUB_CODE)
        link = MagicMock()
        link.branch_name = "feat/task-123"
        
        c1 = MagicMock()
        c1.additions = 50
        c1.deletions = 5
        c1.files_changed = 2
        c1.analysis = MagicMock()
        c1.analysis.heuristic_significance_score = 95.0
        c1.analysis.risk_flags = []

        link.commits = [c1]
        link.pull_requests = []
        task.github_link = link

        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["overall_significance_score"], 97.5)
        self.assertEqual(result["recommended_verdict"], VerificationStatus.PASSED_PRECHECK.value)
        self.assertEqual(result["score_tier"], "Excellent")

    def test_task_all_acceptance_criteria_satisfied(self):
        """100% complete acceptance criteria incurs no penalty."""
        criteria = [
            {"id": "c1", "text": "Deploy to staging", "completed": True},
            {"id": "c2", "text": "Run automated smoke tests", "completed": True}
        ]
        task = self._create_mock_task(criteria=criteria)
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["criteria_completion_rate"], 100.0)
        self.assertEqual(result["overall_significance_score"], 100.0)
        factors = [b["factor"] for b in result["score_breakdown"]]
        self.assertIn("All Acceptance Criteria Satisfied", factors)

    def test_task_partial_acceptance_criteria_penalized(self):
        """2 of 4 criteria complete (50%) incurs 15 pt penalty (30 * 0.5)."""
        criteria = [
            {"id": "c1", "text": "Task A", "completed": True},
            {"id": "c2", "text": "Task B", "completed": True},
            {"id": "c3", "text": "Task C", "completed": False},
            {"id": "c4", "text": "Task D", "completed": False},
        ]
        task = self._create_mock_task(criteria=criteria)
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["criteria_completion_rate"], 50.0)
        self.assertEqual(result["overall_significance_score"], 85.0)
        self.assertIn("acceptance_criteria_incomplete_50pct", result["flags"])
        self.assertTrue(any("Complete the remaining" in tip for tip in result["improvement_tips"]))

    def test_task_empty_acceptance_criteria_handled(self):
        """Empty criteria list defaults to 100% completion rate without crash."""
        task = self._create_mock_task(criteria=[])
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["criteria_completion_rate"], 100.0)
        self.assertEqual(result["overall_significance_score"], 100.0)

    def test_task_non_technical_with_evidence_and_checklist(self):
        """Non-technical deliverable with attached documents and checklists scores high."""
        task = self._create_mock_task(verification_type=VerificationType.DOCUMENT_DELIVERABLE)
        ev = MagicMock()
        ev.id = "ev-1"
        ev.submission_notes = "Attached launch deck PDF"
        ev.created_at = None
        
        doc = MagicMock()
        doc.checklist_answers = {"q1": True, "q2": True}
        ev.documents = [doc]
        task.evidence_submissions = [ev]

        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["overall_significance_score"], 100.0)
        self.assertEqual(result["deliverables_metrics"]["checklist_completed"], 2)
        self.assertEqual(result["deliverables_metrics"]["checklist_total"], 2)

    def test_task_non_technical_missing_evidence_penalized(self):
        """Non-technical deliverable with 0 evidence submissions loses 40 pts."""
        task = self._create_mock_task(verification_type=VerificationType.DOCUMENT_DELIVERABLE)
        task.evidence_submissions = []

        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertEqual(result["overall_significance_score"], 60.0)
        self.assertIn("missing_evidence_submission", result["flags"])

    def test_task_verdict_threshold_passing(self):
        """Score >= 60 results in PASSED_PRECHECK."""
        task = self._create_mock_task()
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertGreaterEqual(result["overall_significance_score"], 60.0)
        self.assertEqual(result["recommended_verdict"], VerificationStatus.PASSED_PRECHECK.value)

    def test_task_verdict_threshold_flagged(self):
        """Score < 60 results in FLAGGED_INSIGNIFICANT."""
        task = self._create_mock_task(verification_type=VerificationType.GITHUB_CODE)
        link = MagicMock()
        link.branch_name = "feat/empty"
        link.commits = []
        link.pull_requests = []
        task.github_link = link
        # 0 commits gives overall_score = 50.0 (< 60.0)
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertLess(result["overall_significance_score"], 60.0)
        self.assertEqual(result["recommended_verdict"], VerificationStatus.FLAGGED_INSIGNIFICANT.value)

    def test_task_explanation_and_fairness_guarantee(self):
        """Task result contains transparent narrative explanation, fairness note, and tips."""
        task = self._create_mock_task()
        result = VerificationEngine.evaluate_task_verification(self.db, task)
        self.assertIn("explanation", result)
        self.assertIn("fairness_note", result)
        self.assertIn("score_breakdown", result)
        self.assertIn("Fairness & Transparency Guarantee", result["fairness_note"])
        self.assertIsInstance(result["improvement_tips"], list)


if __name__ == "__main__":
    unittest.main()
