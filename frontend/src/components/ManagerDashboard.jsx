import React, { useState } from 'react';
import { 
  GitBranch, ShieldCheck, AlertTriangle, Clock, 
  ArrowUpRight, CheckCircle2, ChevronDown, Sparkles, 
  ExternalLink, FileText, GitCommit 
} from 'lucide-react';

export default function ManagerDashboard({ 
  analytics, 
  tasks = [], 
  onSelectTask, 
  currentUser 
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [timeframe, setTimeframe] = useState('This week');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [activeBadgeTooltip, setActiveBadgeTooltip] = useState(null);

  const TIMEFRAME_OPTIONS = [
    { id: 'Today', label: 'Today', desc: 'Last 24 hours' },
    { id: 'This week', label: 'This week', desc: 'Current 7-day sprint' },
    { id: 'This sprint', label: 'This sprint', desc: 'Active 2-week cycle' },
    { id: 'This month', label: 'This month', desc: 'Calendar month' },
    { id: 'All time', label: 'All time', desc: 'Complete history' },
  ];

  // Dynamic timeframe task filtering
  const timeframeTasks = React.useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (timeframe === 'All time') return true;
      const taskDate = new Date(t.deadline || t.created_at || now);
      const diffDays = Math.abs(now - taskDate) / (1000 * 60 * 60 * 24);

      if (timeframe === 'Today') return diffDays <= 1.5;
      if (timeframe === 'This week') return diffDays <= 7.5;
      if (timeframe === 'This sprint') return diffDays <= 14.5;
      if (timeframe === 'This month') return diffDays <= 31;
      return true;
    });
  }, [tasks, timeframe]);

  // Use timeframeTasks if any exist; otherwise fallback to tasks gracefully
  const activeDataset = timeframeTasks.length > 0 ? timeframeTasks : tasks;
  const totalTasksCount = activeDataset.length;

  const pendingReviews = activeDataset.filter(t => t.status === 'under_review');
  const inProgressTasks = activeDataset.filter(t => t.status === 'in_progress');
  const blockedTasks = activeDataset.filter(t => t.status === 'blocked');
  const completedTasks = activeDataset.filter(t => t.status === 'completed');

  // Compute donut segment lengths (Circumference = 2 * pi * 38 = 238.76)
  const CIRCUMFERENCE = 238.76;
  const compRatio = totalTasksCount > 0 ? (completedTasks.length / totalTasksCount) : 0.35;
  const reviewRatio = totalTasksCount > 0 ? (pendingReviews.length / totalTasksCount) : 0.35;
  const inProgRatio = totalTasksCount > 0 ? (inProgressTasks.length / totalTasksCount) : 0.30;

  const compDash = `${compRatio * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  const reviewDash = `${reviewRatio * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
  const inProgDash = `${inProgRatio * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

  const compOffset = 0;
  const reviewOffset = -(compRatio * CIRCUMFERENCE);
  const inProgOffset = -((compRatio + reviewRatio) * CIRCUMFERENCE);

  const filteredTasks = activeDataset.filter(t => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Engineering') return t.category?.department_id || t.verification_type === 'github_code';
    if (activeFilter === 'AI & ML') return t.title.toLowerCase().includes('llama') || t.title.toLowerCase().includes('model');
    if (activeFilter === 'Marketing') return t.verification_type === 'document_deliverable';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
          {currentUser?.role === 'employee' ? 'My Tasks & Performance Dashboard' : 'Your team tasks & verification'}
        </h1>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
          <span className="text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-full border border-[#e8e4da] shadow-sm">
            {currentUser?.full_name} ({currentUser?.role})
          </span>
        </div>
      </div>

      {/* Main Grid: Left Column (Donut + Metric Cards) vs Right Column (Waiting reviews + commits + table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (Span 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Circular Telemetry Donut Card */}
          <div className="intelly-card p-6 rounded-3xl flex flex-col items-center justify-center relative">
            
            {/* Tooltip banner on badge hover */}
            {activeBadgeTooltip && (
              <div className="absolute top-3 px-3 py-1 rounded-full bg-[#141518] text-white text-[10px] font-bold animate-in fade-in z-20">
                {activeBadgeTooltip}
              </div>
            )}

            <div className="relative w-48 h-48 flex items-center justify-center my-2">
              
              {/* Multi-segment Donut Ring SVG */}
              <svg className="w-full h-full -rotate-90 transition-all duration-500" viewBox="0 0 100 100">
                {/* Background track */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1eee4" strokeWidth="12" />
                
                {/* Segment 1: Soft Yellow (Completed) */}
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#fcd34d" strokeWidth="12"
                  strokeDasharray={compDash} strokeDashoffset={compOffset} strokeLinecap="round"
                  className="transition-all duration-500"
                />
                
                {/* Segment 2: Candy Pink (Under review) */}
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#f472b6" strokeWidth="12"
                  strokeDasharray={reviewDash} strokeDashoffset={reviewOffset} strokeLinecap="round"
                  className="transition-all duration-500"
                />
                
                {/* Segment 3: Lavender/Blue (In progress) */}
                <circle
                  cx="50" cy="50" r="38" fill="none" stroke="#93c5fd" strokeWidth="12"
                  strokeDasharray={inProgDash} strokeDashoffset={inProgOffset} strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>

              {/* Center stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
                  {totalTasksCount}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  {currentUser?.role === 'employee' ? `${timeframe} Tasks` : `${timeframe} Total`}
                </span>
              </div>

              {/* Interactive mini badges around donut perimeter */}
              <button
                onMouseEnter={() => setActiveBadgeTooltip(`Under Review: ${pendingReviews.length} tasks (${Math.round(reviewRatio * 100)}%)`)}
                onMouseLeave={() => setActiveBadgeTooltip(null)}
                className="absolute top-2 right-8 w-6 h-6 rounded-full bg-pink-100 hover:scale-110 flex items-center justify-center text-pink-600 shadow-sm text-xs font-bold transition-transform cursor-pointer"
                title="Under Review"
              >
                ♥
              </button>
              
              <button
                onMouseEnter={() => setActiveBadgeTooltip(`Completed: ${completedTasks.length} tasks (${Math.round(compRatio * 100)}%)`)}
                onMouseLeave={() => setActiveBadgeTooltip(null)}
                className="absolute top-10 left-3 w-6 h-6 rounded-full bg-yellow-100 hover:scale-110 flex items-center justify-center text-yellow-700 shadow-sm text-xs font-bold transition-transform cursor-pointer"
                title="Completed"
              >
                $
              </button>
              
              <button
                onMouseEnter={() => setActiveBadgeTooltip(`In Progress: ${inProgressTasks.length} tasks (${Math.round(inProgRatio * 100)}%)`)}
                onMouseLeave={() => setActiveBadgeTooltip(null)}
                className="absolute bottom-4 left-10 w-6 h-6 rounded-full bg-blue-100 hover:scale-110 flex items-center justify-center text-blue-600 shadow-sm text-xs font-bold transition-transform cursor-pointer"
                title="In Progress"
              >
                8
              </button>
            </div>

            {/* Timeframe Dropdown Selector */}
            <div className="relative mt-2">
              <button
                onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-[11px] font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>{timeframe}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showTimeframeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Timeframe Floating Popover Menu */}
              {showTimeframeDropdown && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-white border border-[#e8e4da] shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Select Timeframe
                  </div>
                  {TIMEFRAME_OPTIONS.map((opt) => {
                    const isSelected = timeframe === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTimeframe(opt.id);
                          setShowTimeframeDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#141518] text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div>{opt.label}</div>
                          <div className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {opt.desc}
                          </div>
                        </div>
                        {isSelected && <span className="text-pink-400 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Vertical Stack: Soft Pastel Metric Cards */}
          
          {/* Card 1: Soft Pastel Pink Card (Under review) */}
          <div className="p-5 rounded-3xl bg-[#fdf2f4] border border-[#f9d6dd] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 text-pink-600">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                {currentUser?.role === 'employee' ? 'My submissions in review' : 'Tasks awaiting verification'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-pink-700 font-bold text-[10px] shadow-xs">
                {pendingReviews.length > 0 ? 'Active' : 'Clear'}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 font-['Outfit'] mt-2">
              {pendingReviews.length} Pending
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {currentUser?.role === 'employee' ? 'Awaiting manager approval' : 'Code diffs & deliverables ready'}
            </div>
          </div>

          {/* Card 2: Soft Pastel Lavender Card (In progress) */}
          <div className="p-5 rounded-3xl bg-[#eff6ff] border border-[#dbeafe] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Active in progress
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-blue-700 font-bold text-[10px] shadow-xs">
                {timeframe}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 font-['Outfit'] mt-2">
              {inProgressTasks.length} Tasks
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {currentUser?.role === 'employee' ? 'Currently working on' : 'Engineering, AI & Operations teams'}
            </div>
          </div>

          {/* Card 3: Soft Butter Yellow Card (Blocked or overdue) */}
          <div className="p-5 rounded-3xl bg-[#fefce8] border border-[#fef08a] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Impediments & Blockers
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-amber-700 font-bold text-[10px] shadow-xs">
                {blockedTasks.length > 0 ? 'Urgent' : 'None'}
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 font-['Outfit'] mt-2">
              {blockedTasks.length} Blocked
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Cluster quotas & dependencies
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Waiting for verification (MANAGER ONLY - Removed for employees) */}
          {currentUser?.role !== 'employee' && (
            <div>
              <div className="text-sm font-bold text-slate-900 mb-3 font-['Outfit']">
                Waiting for verification ({pendingReviews.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingReviews.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className="intelly-card intelly-card-hover p-4 rounded-3xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={t.assignees?.[0]?.user?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
                        alt="Avatar"
                        className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {t.assignees?.[0]?.user?.full_name || 'Team Assignee'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {t.title}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectTask(t)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-[11px] font-semibold transition-all shadow-sm"
                    >
                      Inspect evidence
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Latest GitHub & Work Activity Transactions */}
          <div>
            <div className="text-sm font-bold text-slate-900 mb-3 font-['Outfit']">
              Latest GitHub & verified activity
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="intelly-card p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    #a7b8c9d • core
                  </div>
                  <div className="text-[10px] text-slate-400">15 min ago</div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#e6f4ea] text-[#137333] text-xs font-bold font-mono">
                  + 142 lines
                </div>
              </div>

              <div className="intelly-card p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    PR #42 • auth-rbac
                  </div>
                  <div className="text-[10px] text-slate-400">22 min ago</div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#e6f4ea] text-[#137333] text-xs font-bold font-mono">
                  + 465 lines
                </div>
              </div>

              <div className="intelly-card p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    Deck_v2.pdf • mkt
                  </div>
                  <div className="text-[10px] text-slate-400">1 hour ago</div>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#fce8e6] text-[#c5221f] text-xs font-bold">
                  4.8 MB
                </div>
              </div>

            </div>
          </div>

          {/* Section: Filter Tabs & Full Table */}
          <div className="intelly-card rounded-3xl p-5 space-y-4">
            
            {/* Filter Tabs Capsule */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['All', 'Engineering', 'AI & ML', 'Marketing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilter === tab
                      ? 'bg-[#141518] text-white shadow-sm'
                      : 'bg-[#f4f2ec] text-slate-600 hover:bg-[#eae6db]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Task & Title</th>
                    <th className="pb-3 font-semibold">Assignee</th>
                    <th className="pb-3 font-semibold">Evidence Proof</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((t) => {
                    const isGit = t.verification_type === 'github_code';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        <td className="py-3.5 pr-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isGit ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}>
                            {isGit ? 'GitHub Code' : 'Deliverables'}
                          </span>
                        </td>

                        <td className="py-3.5 pr-2 font-bold text-slate-900 max-w-xs truncate">
                          {t.title}
                        </td>

                        <td className="py-3.5 pr-2 text-slate-600">
                          {t.assignees?.[0]?.user?.full_name || 'Unassigned'}
                        </td>

                        <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-500">
                          {isGit ? `${t.github_link?.commits?.length || 1} commits (Clean diff)` : 'PDF + Deliverable URL'}
                        </td>

                        <td className="py-3.5 pr-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'under_review' ? 'bg-pink-100 text-pink-700' :
                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'blocked' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => onSelectTask(t)}
                            className="text-slate-400 hover:text-slate-900 p-1 transition-colors"
                            title="Inspect Evidence"
                          >
                            <ArrowUpRight className="w-4 h-4 inline" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
