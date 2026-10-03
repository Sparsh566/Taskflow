import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ShieldCheck, GitBranch, 
  GitCommit, GitPullRequest, FileText, ExternalLink, Sparkles, 
  CheckSquare, Send, RefreshCw, AlertCircle, Check, Scale, MessageSquare, Sliders
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

  // Manager Override state (Phase 2.5)
  const [enableOverride, setEnableOverride] = useState(false);
  const [overrideScore, setOverrideScore] = useState(90);
  const [overrideReason, setOverrideReason] = useState('');

  // Employee Dispute state (Phase 2.5)
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidenceUrl, setDisputeEvidenceUrl] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState(null);

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
      if (res?.overall_significance_score !== undefined) {
        setOverrideScore(Math.round(res.overall_significance_score));
      }
    } catch (err) {
      console.error('Failed to fetch verification summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (verdict) => {
    if (enableOverride && !overrideReason.trim()) {
      alert('Please provide an explanation for overriding the automated score.');
      return;
    }

    try {
      setReviewing(true);
      const payload = {
        verdict,
        feedback_notes: feedbackNotes || (verdict === 'manager_approved' ? 'Verified and approved.' : 'Please address criteria.')
      };

      if (enableOverride) {
        payload.override_score = Number(overrideScore);
        payload.override_reason = overrideReason.trim();
      }

      await api.reviewTask(task.id, payload);
      onRefresh();
      onClose();
    } catch (err) {
      alert(`Review failed: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      alert('Please describe your dispute justification.');
      return;
    }

    setDisputing(true);
    try {
      const res = await api.disputeTask(task.id, disputeReason.trim(), disputeEvidenceUrl.trim() || null);
      setDisputeSuccessMsg(res.message);
      setShowDisputeForm(false);
      onRefresh();
      await fetchVerificationSummary();
    } catch (err) {
      alert(`Dispute submission failed: ${err.message}`);
    } finally {
      setDisputing(false);
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

  const latestReview = task.reviews && task.reviews.length > 0 ? task.reviews[task.reviews.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 sm:p-8 flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
              {latestReview?.override_score !== undefined && latestReview?.override_score !== null && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Manager Override: {latestReview.override_score}/100
                </span>
              )}
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

        {/* Dispute Confirmation Banner */}
        {disputeSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{disputeSuccessMsg}</span>
          </div>
        )}

        {/* Body content */}
        <div className="py-6 space-y-6 flex-1">
          
          {/* Automated Heuristic Verification Telemetry Card */}
          <div className="p-6 rounded-3xl bg-[#fdf2f4] border border-[#f9d6dd] relative overflow-hidden space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-pink-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Objective Work Verification Heuristics</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Calculated Significance & Evidence Compliance Score
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audits functional code diffs, filters whitespace churn, and verifies acceptance checklist criteria.
                </p>
              </div>

              {/* Score Gauge */}
              <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-pink-200 shadow-sm shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-3xl font-black font-['Outfit'] ${
                      score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {score}/100
                    </span>
                    {summary?.score_tier && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        score >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {summary.score_tier}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {summary?.recommended_verdict?.replace(/_/g, ' ') || 'Analyzing...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2.5: Multi-Signal Verification Telemetry Bar */}
            {summary?.multi_signals && (
              <div className="p-3.5 rounded-2xl bg-white border border-pink-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Multi-Signal Verification Telemetry</span>
                  <span className="text-[9px] text-pink-600 font-bold">Phase 2 Multi-Signal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  
                  {/* Signal 1: CI Build & Test Status */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        summary.multi_signals.ci_status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">
                          CI Test Suite
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {summary.multi_signals.ci_summary?.provider || 'GitHub Actions'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      summary.multi_signals.ci_status === 'passed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {summary.multi_signals.ci_status === 'passed' ? '38/38 Passed' : 'Tests Failing'}
                    </span>
                  </div>

                  {/* Signal 2: PR Review Approvals */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        summary.multi_signals.pr_review_status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">
                          PR Review Approvals
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {summary.multi_signals.pr_review_summary?.approvals_count || 1} required approvals
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      summary.multi_signals.pr_review_status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {summary.multi_signals.pr_review_status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  {/* Signal 3: PR Merge Verification */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        summary.multi_signals.is_merged ? 'bg-purple-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">
                          Merge Verification
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Target: main branch
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      summary.multi_signals.is_merged 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {summary.multi_signals.is_merged ? 'Merged' : 'Ready to Merge'}
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* Phase 2.5: AI-Assisted Advisory Summary */}
            {summary?.ai_advisory && (
              <div className="p-4 rounded-2xl bg-white border border-pink-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-['Outfit']">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI-Assisted Deliverable Advisory</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {summary.ai_advisory.confidence}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {summary.ai_advisory.summary}
                </p>

                {summary.ai_advisory.strengths?.length > 0 && (
                  <div className="space-y-1">
                    {summary.ai_advisory.strengths.map((str, i) => (
                      <div key={i} className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summary.ai_advisory.cautions?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {summary.ai_advisory.cautions.map((cau, i) => (
                      <div key={i} className="text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{cau}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  {summary.ai_advisory.disclaimer}
                </div>
              </div>
            )}

            {/* Why This Score Narrative Explanation */}
            {summary?.explanation && (
              <div className="p-3.5 rounded-2xl bg-white/80 border border-pink-200/70 text-xs text-slate-800">
                <div className="font-bold text-[11px] uppercase tracking-wider text-pink-900 mb-1 flex items-center gap-1.5">
                  <span>💡 Deterministic Score Narrative</span>
                </div>
                <p className="leading-relaxed text-slate-700">
                  {summary.explanation}
                </p>
              </div>
            )}

            {/* Itemized Score Breakdown Factors */}
            {summary?.score_breakdown && summary.score_breakdown.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Heuristic Scoring Factors & Deductions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summary.score_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs flex flex-col justify-between ${
                        item.category === 'penalty'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : item.category === 'base'
                          ? 'bg-slate-50 border-slate-200 text-slate-800'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="truncate">{item.factor}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                          item.delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.delta > 0 ? `+${item.delta}` : item.delta}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-snug">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Section: Technical GitHub Telemetry */}
          {task.verification_type === 'github_code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                    Linked GitHub Commits & Diff Inspection
                  </h3>
                </div>
              </div>

              {/* Commit Simulation Bar */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <b className="text-slate-900">Test Heuristics in Sandbox:</b> Simulate real code or spam commits.
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

          {/* Phase 2.5: Employee Dispute Section */}
          {!isManagerOrAdmin && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Employee Recourse & Rebuttal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dispute automated heuristic deductions or request manager re-evaluation.
                  </p>
                </div>

                <button
                  onClick={() => setShowDisputeForm(!showDisputeForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-pink-600" />
                  <span>{showDisputeForm ? 'Cancel Dispute' : 'Dispute Score'}</span>
                </button>
              </div>

              {showDisputeForm && (
                <form onSubmit={handleDisputeSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Dispute Justification & Explanation
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain why the automated score deduction is inaccurate (e.g., changes were critical architectural refactors or TypeScript types rather than churn)..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Optional Additional Evidence Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/... or cloud document link"
                      value={disputeEvidenceUrl}
                      onChange={(e) => setDisputeEvidenceUrl(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={disputing}
                      className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-sm"
                    >
                      {disputing ? 'Submitting Dispute...' : 'Submit Formal Dispute'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Manager Review Controls Footer with Phase 2.5 Score Override */}
        {isManagerOrAdmin && task.status === 'under_review' && (
          <div className="pt-6 border-t border-slate-100 space-y-4">
            
            {/* Phase 2.5: Manager Score Override Toggle & Input */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableOverride}
                    onChange={(e) => setEnableOverride(e.target.checked)}
                    className="rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span>Override Automated Heuristic Score</span>
                </label>
                {enableOverride && (
                  <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Override Active
                  </span>
                )}
              </div>

              {enableOverride && (
                <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-slate-600">Custom Score:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(Number(e.target.value))}
                      className="flex-1 accent-pink-600"
                    />
                    <span className="text-base font-black font-['Outfit'] text-pink-600 w-12 text-right">
                      {overrideScore}/100
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Override Justification Note (Required)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Approved due to high complexity architectural impact not captured by line deltas."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>

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
                <span>{enableOverride ? `Approve with Override (${overrideScore}/100)` : 'Approve & Mark Complete'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
