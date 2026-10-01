import React, { useState } from 'react';
import { 
  GitBranch, FileText, CheckCircle2, Clock, AlertTriangle, 
  Search, CheckSquare, Plus, FileCheck, ArrowUpRight 
} from 'lucide-react';

const COLUMNS = [
  { id: 'pending', title: 'To Do / Backlog', dotColor: 'bg-slate-400' },
  { id: 'in_progress', title: 'In Progress', dotColor: 'bg-blue-400' },
  { id: 'blocked', title: 'Blocked', dotColor: 'bg-rose-500' },
  { id: 'under_review', title: 'Under Verification', dotColor: 'bg-pink-500' },
  { id: 'completed', title: 'Verified Complete', dotColor: 'bg-emerald-500' },
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
  const [filterType, setFilterType] = useState('all');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

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
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Task Kanban & Work Verification Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status columns, branch links, acceptance criteria, and blocker escalations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'my_tasks', 'technical', 'non_technical'].map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterType === ft
                  ? 'bg-[#141518] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e8e4da]'
              }`}
            >
              {ft === 'all' ? `All Tasks (${tasks.length})` :
               ft === 'my_tasks' ? 'Assigned to Me' :
               ft === 'technical' ? 'GitHub Code' : 'Deliverables & Docs'}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl bg-[#ece9de]/60 border border-[#e4dfd3] p-3.5 min-h-[550px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Outfit']">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-600 px-2 py-0.5 rounded-full bg-white/80 border border-black/5 shadow-xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
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
                        className="intelly-card intelly-card-hover p-4 rounded-2xl flex flex-col justify-between group cursor-pointer"
                        onClick={() => onSelectTask(task)}
                      >
                        <div>
                          {/* Tags: Priority & Verification Type */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                              task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                              task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority}
                            </span>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              {task.verification_type === 'github_code' ? (
                                <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
                                  <GitBranch className="w-3 h-3 text-slate-700" />
                                  git
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
                                  <FileText className="w-3 h-3 text-slate-700" />
                                  docs
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Task Title */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>

                          {/* Acceptance Criteria */}
                          {criteria.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                              <CheckSquare className="w-3 h-3 text-slate-400" />
                              <span>Criteria: {completedCriteria}/{criteria.length} done</span>
                            </div>
                          )}

                          {/* Blocker alert if blocked */}
                          {task.status === 'blocked' && (
                            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-700">
                              <div className="font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Blocker:
                              </div>
                              <div className="line-clamp-1 italic mt-0.5">
                                {task.blockers?.[task.blockers.length - 1]?.reason}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer: Assignee & Action button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={task.assignees?.[0]?.user?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50'}
                              alt="Assignee"
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[70px]">
                              {task.assignees?.[0]?.user?.full_name?.split(' ')[0] || 'Unassigned'}
                            </span>
                          </div>

                          {/* Contextual Action Button */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {task.status === 'pending' && canAct && (
                              <button
                                onClick={() => onStartTask(task.id)}
                                className="px-2.5 py-1 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-[10px] font-bold shadow-xs transition-all"
                              >
                                Start
                              </button>
                            )}

                            {task.status === 'in_progress' && canAct && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onOpenBlockerModal(task)}
                                  className="p-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all"
                                  title="Report Blocker"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onOpenSubmitEvidence(task)}
                                  className="px-2.5 py-1 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-[10px] font-bold shadow-xs transition-all"
                                >
                                  Submit
                                </button>
                              </div>
                            )}

                            {task.status === 'under_review' && (
                              <button
                                onClick={() => onSelectTask(task)}
                                className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 hover:bg-pink-200 text-[10px] font-bold transition-all flex items-center gap-1"
                              >
                                <FileCheck className="w-3 h-3" /> Inspect
                              </button>
                            )}

                            {task.status === 'completed' && (
                              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
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
