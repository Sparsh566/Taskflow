import React, { useState } from 'react';
import { 
  GitBranch, FileText, CheckCircle2, Clock, AlertTriangle, 
  Search, ShieldAlert, ArrowRight, CheckSquare, Plus, FileCheck 
} from 'lucide-react';

const COLUMNS = [
  { id: 'pending', title: 'To Do / Backlog', color: 'border-slate-700' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/40' },
  { id: 'blocked', title: 'Blocked', color: 'border-rose-500/40' },
  { id: 'under_review', title: 'Under Verification', color: 'border-amber-500/40' },
  { id: 'completed', title: 'Verified Complete', color: 'border-emerald-500/40' },
];

export default function TaskBoard({ 
  tasks, 
  onSelectTask, 
  onStartTask, 
  onOpenSubmitEvidence, 
  onOpenBlockerModal, 
  onOpenCreateTask,
  currentUser 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, my_tasks, technical, non_technical

  const filteredTasks = tasks.filter((t) => {
    // Search
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filter
    if (filterType === 'my_tasks') {
      return t.assignees?.some(a => a.user_id === currentUser?.id);
    }
    if (filterType === 'technical') {
      return t.verification_type === 'github_code';
    }
    if (filterType === 'non_technical') {
      return t.verification_type !== 'github_code';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, acceptance criteria, or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilterType('my_tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'my_tasks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setFilterType('technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'technical'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            GitHub Technical
          </button>
          <button
            onClick={() => setFilterType('non_technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'non_technical'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Deliverables & Docs
          </button>
        </div>

      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl bg-slate-900/40 border border-slate-800/80 p-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-3 border-b border-slate-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    col.id === 'pending' ? 'bg-slate-400' :
                    col.id === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                    col.id === 'blocked' ? 'bg-rose-400' :
                    col.id === 'under_review' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-600 text-xs italic">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const criteria = task.acceptance_criteria || [];
                    const completedCriteria = criteria.filter(c => c.completed).length;
                    const isAssignee = task.assignees?.some(a => a.user_id === currentUser?.id);
                    const canAct = isAssignee || currentUser?.role === 'manager' || currentUser?.role === 'admin';

                    return (
                      <div
                        key={task.id}
                        className="glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col justify-between group cursor-pointer"
                        onClick={() => onSelectTask(task)}
                      >
                        <div>
                          {/* Tags: Priority & Verification Type */}
                          <div className="flex items-center justify-between gap-1 mb-2.5">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              task.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {task.priority}
                            </span>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              {task.verification_type === 'github_code' ? (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/20">
                                  <GitBranch className="w-3 h-3" />
                                  Git
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                                  <FileText className="w-3 h-3" />
                                  Docs
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>

                          {/* Acceptance Criteria progress */}
                          {criteria.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                              <CheckSquare className="w-3 h-3 text-indigo-400" />
                              <span>Criteria: {completedCriteria}/{criteria.length} done</span>
                            </div>
                          )}

                          {/* Blocker alert if blocked */}
                          {task.status === 'blocked' && (
                            <div className="mt-2.5 p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300">
                              <div className="font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Blocker Active:
                              </div>
                              <div className="line-clamp-1 italic mt-0.5">
                                {task.blockers?.[task.blockers.length - 1]?.reason}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer: Assignee & Action button */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {task.assignees?.length > 0 ? (
                              <img
                                src={task.assignees[0].user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                                alt="Assignee"
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                                title={task.assignees[0].user?.full_name}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-500">Unassigned</span>
                            )}
                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                              {task.assignees?.[0]?.user?.full_name?.split(' ')[0] || ''}
                            </span>
                          </div>

                          {/* Contextual Action Button */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {task.status === 'pending' && canAct && (
                              <button
                                onClick={() => onStartTask(task.id)}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all"
                              >
                                Start
                              </button>
                            )}

                            {task.status === 'in_progress' && canAct && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onOpenBlockerModal(task)}
                                  className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-all"
                                  title="Report Blocker"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onOpenSubmitEvidence(task)}
                                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[10px] font-bold transition-all"
                                >
                                  Submit
                                </button>
                              </div>
                            )}

                            {task.status === 'under_review' && (
                              <button
                                onClick={() => onSelectTask(task)}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-[10px] font-bold transition-all flex items-center gap-1"
                              >
                                <FileCheck className="w-3 h-3" /> Inspect
                              </button>
                            )}

                            {task.status === 'completed' && (
                              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
