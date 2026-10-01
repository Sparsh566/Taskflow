import React from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Layers, Users, ArrowUpRight, GitPullRequest, FileCheck 
} from 'lucide-react';

export default function ManagerDashboard({ 
  analytics, 
  tasks, 
  onSelectTask, 
  onOpenCreateTask,
  currentUser 
}) {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading analytics telemetry...
      </div>
    );
  }

  const pendingReviews = tasks.filter(t => t.status === 'under_review');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome & Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Command Center
              </span>
              <span className="text-xs text-slate-400">
                Real-Time Telemetry & Heuristics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Manager Verification & Progress Analytics
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track team velocity, inspect technical GitHub commits, analyze diff significance, and approve non-technical deliverables with objective evidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateTask}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              + Assign New Task
            </button>
          </div>
        </div>

        {/* Ambient subtle glow decoration */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Tasks</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Outfit']">
            {analytics.total_tasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 5 departments</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Progress</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-['Outfit']">
            {analytics.in_progress_tasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active execution</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-amber-950/20 border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold">Under Review</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-['Outfit']">
            {analytics.under_review_tasks}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">Ready for manager signoff</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-rose-950/20 border-rose-500/20">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-semibold">Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-['Outfit']">
            {analytics.blocked_tasks}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">Immediate action needed</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-['Outfit']">
            {analytics.completed_tasks}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Verified & closed</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Approval Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-['Outfit']">
            {analytics.verification_approval_rate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Evidence compliance</div>
        </div>

      </div>

      {/* Action Required: Tasks Ready for Review & Blockers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Verification Reviews */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Verification Queue ({pendingReviews.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Click to inspect evidence</span>
          </div>

          <div className="space-y-3">
            {pendingReviews.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No submissions waiting for review.</p>
            ) : (
              pendingReviews.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          t.verification_type === 'github_code'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {t.verification_type === 'github_code' ? 'GitHub Code' : 'Deliverables'}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        Assignee: {t.assignees?.map(a => a.user?.full_name).join(', ') || 'Unassigned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                      Inspect
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Blockers */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Active Blockers ({blockedTasks.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Escalated to management</span>
          </div>

          <div className="space-y-3">
            {blockedTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Zero active blockers reported! Operations smooth.</p>
            ) : (
              blockedTasks.map((t) => {
                const latestBlocker = t.blockers?.[t.blockers.length - 1];
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-rose-200">
                          {t.title}
                        </div>
                        <div className="text-xs text-rose-300/80 mt-1 italic">
                          "{latestBlocker?.reason || 'No description provided'}"
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          Reported by: {latestBlocker?.reporter?.full_name || 'Team member'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        Urgent
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Employee Workload & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workload by Employee */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Team Workload & Capacity
              </h3>
              <p className="text-xs text-slate-400">Real-time task allocations across engineering, AI, and operations</p>
            </div>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="space-y-4">
            {analytics.workload_by_employee.map((emp) => {
              const maxTasks = 5;
              const pct = Math.min(100, Math.round((emp.assigned_tasks / maxTasks) * 100));
              return (
                <div key={emp.user_id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{emp.full_name}</span>
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {emp.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span><b className="text-blue-400">{emp.in_progress_tasks}</b> active</span>
                      <span><b className="text-emerald-400">{emp.completed_tasks}</b> done</span>
                      <span className="font-bold text-white">{emp.assigned_tasks} total</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Tasks Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h3 className="text-base font-bold text-white font-['Outfit'] mb-1">
            Department Scope
          </h3>
          <p className="text-xs text-slate-400 mb-6">Distribution across organizational modules</p>

          <div className="space-y-4">
            {analytics.department_distribution.map((dept) => (
              <div key={dept.department_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{dept.department_name}</div>
                  <div className="text-[10px] font-mono text-indigo-400 tracking-wider">[{dept.code}]</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{dept.task_count}</span>
                  <span className="text-[11px] text-slate-500">tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
