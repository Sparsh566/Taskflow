import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, Plus, ChevronLeft, ChevronRight, Clock, 
  Users, ArrowRight, Calendar as CalendarIcon, CheckCircle2, 
  AlertCircle, ShieldCheck, GitBranch, FileText 
} from 'lucide-react';

export default function ScheduleView({ 
  tasks = [], 
  currentUser, 
  onSelectTask, 
  onOpenCreateTask 
}) {
  const [viewMode, setViewMode] = useState('Week');
  const [sprintOffset, setSprintOffset] = useState(0); // 0 = current sprint, -1 = prev, +1 = next
  const [filterType, setFilterType] = useState('all');

  // Compute current week days based on sprintOffset
  const weekDays = useMemo(() => {
    const today = new Date();
    // Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (sprintOffset * 7);
    const monday = new Date(today.setDate(diff));

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        dateObj: d,
        dayName: dayNames[i],
        fullDateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateNumber: d.getDate(),
        isToday,
      });
    }
    return days;
  }, [sprintOffset]);

  const dateRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.fullDateStr} - ${last.fullDateStr}`;
  }, [weekDays]);

  // Filter tasks based on filterType
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterType === 'all') return true;
      if (filterType === 'in_progress') return t.status === 'in_progress';
      if (filterType === 'under_review') return t.status === 'under_review';
      if (filterType === 'blocked') return t.status === 'blocked';
      return true;
    });
  }, [tasks, filterType]);

  // Assign tasks across days deterministically
  const tasksByDayIndex = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    filteredTasks.forEach((task, idx) => {
      let dayIdx = 0;
      if (task.deadline) {
        try {
          const dl = new Date(task.deadline);
          // Match day of week: Monday=0 ... Sunday=6
          const jsDay = dl.getDay();
          dayIdx = jsDay === 0 ? 6 : jsDay - 1;
        } catch {
          dayIdx = idx % 5;
        }
      } else {
        dayIdx = idx % 5;
      }
      if (map[dayIdx]) {
        map[dayIdx].push(task);
      } else {
        map[0].push(task);
      }
    });

    return map;
  }, [filteredTasks]);

  const TIME_BLOCKS = [
    { label: '09:00', period: 'Morning Sync & Plan' },
    { label: '11:00', period: 'Core Execution' },
    { label: '14:00', period: 'Verification & Reviews' },
    { label: '16:30', period: 'Deliverable Wrap-up' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 select-none">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Stay up to date, {currentUser?.full_name?.split(' ')[0] || 'Team'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly task milestones, verification deadlines, and sprint schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add task button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task</span>
          </button>

          {/* View switcher pill */}
          <div className="flex items-center bg-white p-1 rounded-full border border-[#e8e4da] shadow-sm">
            {['Today', 'Week', 'Month'].map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === v
                    ? 'bg-[#141518] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Capsule Selector & Sprint Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-[#e8e4da] shadow-sm">
        
        {/* Date Display Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-full">
            <CalendarIcon className="w-3.5 h-3.5 text-pink-600" />
            <span>{dateRangeLabel}</span>
          </div>

          {/* Filter Pills */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-200">
            {[
              { id: 'all', label: `All (${tasks.length})` },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'under_review', label: 'In Review' },
              { id: 'blocked', label: 'Blocked' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sprint Controls */}
        <div className="flex items-center gap-2 text-slate-600">
          <button
            onClick={() => setSprintOffset((prev) => prev - 1)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setSprintOffset(0)}
            className="text-xs font-bold text-slate-800 hover:text-pink-600 px-2 py-1 rounded-md transition-colors"
          >
            {sprintOffset === 0 ? 'Current Sprint' : `Sprint (Offset ${sprintOffset > 0 ? `+${sprintOffset}` : sprintOffset})`}
          </button>

          <button
            onClick={() => setSprintOffset((prev) => prev + 1)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-700"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW MODE: WEEK (Default) */}
      {viewMode === 'Week' && (
        <div className="intelly-card rounded-3xl p-5 overflow-x-auto shadow-sm">
          
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-3 min-w-[960px] border-b border-slate-100 pb-4 mb-4 text-center">
            <div className="text-xs font-bold text-slate-400 pt-2 font-mono">
              TIME
            </div>
            
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-full py-2 px-1 rounded-2xl transition-all ${
                  d.isToday
                    ? 'bg-[#141518] text-white shadow-md'
                    : 'bg-[#faf8f4] text-slate-700 border border-[#e8e4da]'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    d.isToday ? 'text-pink-400' : 'text-slate-400'
                  }`}>
                    {d.dayName}
                  </div>
                  <div className="text-sm font-black font-['Outfit'] mt-0.5">
                    {d.dateNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows Grid */}
          <div className="space-y-4 min-w-[960px]">
            {TIME_BLOCKS.map((slot, sIdx) => (
              <div
                key={slot.label}
                className={`grid grid-cols-8 gap-3 items-start ${
                  sIdx > 0 ? 'border-t border-dashed border-slate-200 pt-4' : ''
                }`}
              >
                {/* Time slot label */}
                <div className="text-slate-400 font-mono text-[11px] pt-1">
                  <div className="font-bold text-slate-700">{slot.label}</div>
                  <div className="text-[9px] text-slate-400 truncate">{slot.period}</div>
                </div>

                {/* 7 Days Columns */}
                {weekDays.map((_, dayIdx) => {
                  const dayTasks = tasksByDayIndex[dayIdx] || [];
                  // Show task for this slot if available
                  const taskForSlot = dayTasks[sIdx];

                  return (
                    <div key={dayIdx} className="min-h-[75px]">
                      {taskForSlot ? (
                        <div
                          onClick={() => onSelectTask(taskForSlot)}
                          className={`group p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${
                            taskForSlot.status === 'under_review'
                              ? 'bg-[#fdf2f4] border-[#f9d6dd] hover:border-pink-300'
                              : taskForSlot.status === 'blocked'
                              ? 'bg-[#fefce8] border-[#fef08a] hover:border-amber-300'
                              : taskForSlot.status === 'completed'
                              ? 'bg-[#e6f4ea] border-[#ceead6] hover:border-emerald-300'
                              : 'bg-[#eff6ff] border-[#dbeafe] hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              taskForSlot.verification_type === 'github_code'
                                ? 'bg-white text-blue-700'
                                : 'bg-white text-pink-700'
                            }`}>
                              {taskForSlot.verification_type === 'github_code' ? 'Code' : 'Deliverable'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {taskForSlot.priority}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight group-hover:text-pink-600 transition-colors">
                            {taskForSlot.title}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                            <span className="capitalize font-medium">
                              {taskForSlot.status.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {slot.label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full rounded-2xl border border-dashed border-slate-100 hover:border-slate-300 transition-colors p-2 flex items-center justify-center">
                          <span className="text-[10px] text-slate-300">•</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* VIEW MODE: TODAY */}
      {viewMode === 'Today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 intelly-card p-6 rounded-3xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
              Today's Execution Agenda
            </h2>

            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tasks scheduled for today.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da] hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          task.status === 'under_review' ? 'bg-pink-100 text-pink-700' :
                          task.status === 'blocked' ? 'bg-amber-100 text-amber-700' :
                          task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">[{task.priority}]</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{task.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                    </div>

                    <button className="px-3.5 py-1.5 rounded-full bg-[#141518] text-white text-xs font-semibold shrink-0">
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Summary */}
          <div className="intelly-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
              Sprint Health & Velocity
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
                <strong>Active Work:</strong> {tasks.filter(t => t.status === 'in_progress').length} tasks in progress
              </div>
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-100 text-xs text-pink-900">
                <strong>Pending Verification:</strong> {tasks.filter(t => t.status === 'under_review').length} tasks awaiting manager sign-off
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
                <strong>Active Blockers:</strong> {tasks.filter(t => t.status === 'blocked').length} blockers flagged
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: MONTH */}
      {viewMode === 'Month' && (
        <div className="intelly-card p-6 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
            Sprint Month Overview ({tasks.length} total tasks)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da] hover:border-slate-400 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    task.status === 'under_review' ? 'bg-pink-100 text-pink-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sprint End'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{task.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
