import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ShieldCheck, GitBranch, 
  GitCommit, GitPullRequest, FileText, ExternalLink, Sparkles, 
  CheckSquare, Send, RefreshCw, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function VerificationModal({ 
  task, 
  onClose, 
  onRefresh, 
  currentUser 
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simType, setSimType] = useState('good'); // 'good' or 'spam'

  useEffect(() => {
    if (task) {
      fetchVerificationSummary();
    }
  }, [task]);

  const fetchVerificationSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getVerificationSummary(task.id);
      setSummary(res);
    } catch (err) {
      console.error('Failed to fetch verification summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (verdict) => {
    try {
      setReviewing(true);
      await api.reviewTask(task.id, {
        verdict,
        feedback_notes: feedbackNotes || (verdict === 'manager_approved' ? 'Verified and approved.' : 'Please address criteria.')
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert(`Review failed: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  const handleSimulateCommit = async () => {
    try {
      setSimulating(true);
      let commitPayload = [];

      if (simType === 'good') {
        commitPayload = [{
          commit_sha: 'commit-' + Math.random().toString(16).substring(2, 10),
          commit_message: 'feat(core): implement secure signature verification and input validation',
          author_github_login: currentUser?.github_username || 'alex-rivera-dev',
          additions: 84,
          deletions: 12,
          files_changed: 3,
          raw_diff_summary: [
            {
              patch: "@@ -1,5 +1,15 @@\n+def verify_signature(data, sig):\n+    return hmac.compare_digest(data, sig)\n+    # Validated\n"
            }
          ]
        }];
      } else {
        // Spam / Insignificant commit simulation
        commitPayload = [{
          commit_sha: 'spam-' + Math.random().toString(16).substring(2, 10),
          commit_message: 'update',
          author_github_login: currentUser?.github_username || 'alex-rivera-dev',
          additions: 5,
          deletions: 0,
          files_changed: 1,
          raw_diff_summary: [
            {
              patch: "@@ -10,3 +10,8 @@\n+   \n+   \n+   # minor update\n+   \n"
            }
          ]
        }];
      }

      await api.syncCommits(task.id, commitPayload);
      await fetchVerificationSummary();
      onRefresh();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (!task) return null;

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const score = summary ? summary.overall_significance_score : 100;
  const isHighQuality = score >= 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                task.status === 'under_review' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                task.status === 'blocked' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-blue-500/20 text-blue-300'
              }`}>
                Status: {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400">
                Created by: {task.creator?.full_name || 'Manager'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              {task.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {task.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="py-6 space-y-6 flex-1">
          
          {/* Automated Heuristic Verification Telemetry Card */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Automated Work Verification Heuristics
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Calculated Significance & Evidence Compliance Score
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluates code changes, filters whitespace/comment spam, and verifies deliverables against acceptance criteria.
                </p>
              </div>

              {/* Score Gauge */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-3xl font-black font-['Outfit'] ${
                    isHighQuality ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {score}/100
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {summary?.recommended_verdict?.replace('_', ' ') || 'Calculating...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            {summary?.flags && summary.flags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Engine Flags:</span>
                {summary.flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section: Technical GitHub Evidence (If technical task) */}
          {task.verification_type === 'github_code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    GitHub Code Evidence & Commits
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Branch: <code className="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded">{task.github_link?.branch_name || 'main'}</code>
                </span>
              </div>

              {/* Commits List */}
              <div className="space-y-2">
                {task.github_link?.commits?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                    No commits captured yet for this task.
                  </div>
                ) : (
                  task.github_link?.commits?.map((commit) => (
                    <div
                      key={commit.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <GitCommit className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-200">{commit.commit_message}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                            <span>{commit.commit_sha?.substring(0, 7)}</span>
                            <span>•</span>
                            <span>by {commit.author_github_login}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 font-mono font-bold">+{commit.additions}</span>
                        <span className="text-rose-400 font-mono font-bold">-{commit.deletions}</span>
                        {commit.analysis && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            commit.analysis.heuristic_significance_score >= 70
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            Score: {commit.analysis.heuristic_significance_score}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Commit Simulator Panel (For interactive testing of verification engine) */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-indigo-300">Live Commit Simulation</div>
                  <div className="text-[11px] text-slate-400">Test how the verification engine analyzes clean commits vs whitespace/comment churn.</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="good">Legitimate Code (+84 lines)</option>
                    <option value="spam">Trivial / Whitespace Churn</option>
                  </select>
                  <button
                    onClick={handleSimulateCommit}
                    disabled={simulating}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
                    Simulate Push
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Non-Technical Deliverables & Evidence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Submitted Deliverables & Documents ({task.evidence_submissions?.length || 0})
              </h3>
            </div>

            {task.evidence_submissions?.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                No deliverable files or documents submitted yet.
              </div>
            ) : (
              task.evidence_submissions?.map((ev) => (
                <div key={ev.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Submitted by <b className="text-slate-200">{ev.submitter?.full_name}</b></span>
                    <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                  </div>

                  {ev.submission_notes && (
                    <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      "{ev.submission_notes}"
                    </p>
                  )}

                  {/* Documents & links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ev.documents?.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between text-xs text-slate-200 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="truncate font-semibold">{doc.title}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section: Acceptance Criteria Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Acceptance Criteria Verification
              </h3>
            </div>

            <div className="space-y-2">
              {task.acceptance_criteria?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center ${
                    item.completed ? 'bg-emerald-500 text-white' : 'border border-slate-700 bg-slate-900'
                  }`}>
                    {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={item.completed ? 'text-slate-300 line-through' : 'text-slate-200'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Manager Review Controls Footer */}
        {isManagerOrAdmin && task.status === 'under_review' && (
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Manager Review Feedback & Verification Notes
              </label>
              <textarea
                rows={2}
                placeholder="Provide constructive feedback or approval notes for the employee..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleReview('manager_rejected')}
                disabled={reviewing}
                className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
              >
                Reject & Request Revisions
              </button>
              <button
                onClick={() => handleReview('manager_approved')}
                disabled={reviewing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Mark Complete
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
