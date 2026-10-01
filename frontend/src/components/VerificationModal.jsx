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
  const [simType, setSimType] = useState('good');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 sm:p-8 flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                task.status === 'under_review' ? 'bg-pink-100 text-pink-700' :
                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                task.status === 'blocked' ? 'bg-rose-100 text-rose-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                Status: {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Created by: {task.creator?.full_name || 'Manager'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">
              {task.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {task.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="py-6 space-y-6 flex-1">
          
          {/* Automated Heuristic Verification Telemetry Card */}
          <div className="p-6 rounded-3xl bg-[#fdf2f4] border border-[#f9d6dd] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-pink-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Automated Work Verification Heuristics</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Calculated Significance & Evidence Compliance Score
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filters whitespace manipulations, flags repetitive commits, and validates deliverables.
                </p>
              </div>

              {/* Score Gauge */}
              <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-pink-200 shadow-sm shrink-0">
                <div className="text-right">
                  <div className={`text-3xl font-black font-['Outfit'] ${
                    isHighQuality ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {score}/100
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {summary?.recommended_verdict?.replace('_', ' ') || 'Analyzing...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            {summary?.flags && summary.flags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-pink-200/60 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Flagged Conditions:</span>
                {summary.flags.map((flag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section: Technical GitHub Evidence */}
          {task.verification_type === 'github_code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                    GitHub Code Evidence & Commits
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Branch: <code className="text-blue-700 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{task.github_link?.branch_name || 'main'}</code>
                </span>
              </div>

              {/* Commits List */}
              <div className="space-y-2">
                {task.github_link?.commits?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No commits captured yet for this task.
                  </div>
                ) : (
                  task.github_link?.commits?.map((commit) => (
                    <div
                      key={commit.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#e8e4da] shadow-xs flex items-center justify-between text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <GitCommit className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-900">{commit.commit_message}</span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                            <span>{commit.commit_sha?.substring(0, 7)}</span>
                            <span>•</span>
                            <span>by {commit.author_github_login}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-emerald-700 font-mono font-bold">+{commit.additions}</span>
                        <span className="text-rose-700 font-mono font-bold">-{commit.deletions}</span>
                        {commit.analysis && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            commit.analysis.heuristic_significance_score >= 70
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Score: {commit.analysis.heuristic_significance_score}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Commit Simulator Panel */}
              <div className="p-4 rounded-3xl bg-[#f4f2ec] border border-[#e5e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">Live Commit Simulation Engine</div>
                  <div className="text-[11px] text-slate-500">Test how clean code vs whitespace churn re-evaluates significance.</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value)}
                    className="bg-white border border-slate-200 text-xs text-slate-800 rounded-full px-3 py-1.5 focus:outline-none shadow-xs"
                  >
                    <option value="good">Legitimate Code (+84 lines)</option>
                    <option value="spam">Trivial / Whitespace Churn</option>
                  </select>
                  <button
                    onClick={handleSimulateCommit}
                    disabled={simulating}
                    className="px-4 py-1.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCommit className="w-3.5 h-3.5" />}
                    Simulate Push
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section: Non-Technical Deliverables */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                Submitted Deliverables & Documents ({task.evidence_submissions?.length || 0})
              </h3>
            </div>

            {task.evidence_submissions?.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                No deliverable files or documents submitted yet.
              </div>
            ) : (
              task.evidence_submissions?.map((ev) => (
                <div key={ev.id} className="p-4 rounded-3xl bg-white border border-[#e8e4da] shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Submitted by <b className="text-slate-800">{ev.submitter?.full_name}</b></span>
                    <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                  </div>

                  {ev.submission_notes && (
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{ev.submission_notes}"
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ev.documents?.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-400 flex items-center justify-between text-xs text-slate-900 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-pink-600 shrink-0" />
                          <span className="truncate font-semibold">{doc.title}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 shrink-0" />
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
              <CheckSquare className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                Acceptance Criteria Verification
              </h3>
            </div>

            <div className="space-y-2">
              {task.acceptance_criteria?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#e8e4da] shadow-xs text-xs"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center ${
                    item.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-slate-50'
                  }`}>
                    {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={item.completed ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Manager Review Controls Footer */}
        {isManagerOrAdmin && task.status === 'under_review' && (
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Manager Review Feedback & Verification Verdict Notes
              </label>
              <textarea
                rows={2}
                placeholder="Provide feedback or sign-off approval notes for the employee..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleReview('manager_rejected')}
                disabled={reviewing}
                className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
              >
                Reject & Request Revisions
              </button>
              <button
                onClick={() => handleReview('manager_approved')}
                disabled={reviewing}
                className="px-5 py-2.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Approve & Mark Complete
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
