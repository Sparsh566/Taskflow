import React, { useState } from 'react';
import { ChevronDown, Plus, ChevronLeft, ChevronRight, Clock, Users, ArrowRight } from 'lucide-react';

const DAYS = [
  { day: 'MONDAY', date: '11/05', active: false },
  { day: 'TUESDAY', date: '12/05', active: false },
  { day: 'WEDNESDAY', date: '13/05', active: false },
  { day: 'THU', date: '14/05', active: true },
  { day: 'FR', date: '15/05', active: false },
  { day: 'SA', date: '16/05', active: false },
  { day: 'SU', date: '17/05', active: false },
];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30'
];

export default function ScheduleView({ 
  tasks, 
  currentUser, 
  onSelectTask, 
  onOpenCreateTask 
}) {
  const [viewMode, setViewMode] = useState('Week');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Stay up to date, {currentUser?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly task milestones, verification deadlines, and sprint schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add task button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
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
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
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

      {/* Date Range Capsule Selector */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-[#e8e4da] shadow-sm">
        <button className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors">
          <span>May 11/05 - 17/05</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs text-slate-700 font-semibold px-2">Current Sprint</span>
          <button className="p-1 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Schedule Time Grid from reference UI */}
      <div className="intelly-card rounded-3xl p-6 overflow-x-auto shadow-sm">
        
        {/* Days Header */}
        <div className="grid grid-cols-8 gap-4 min-w-[900px] border-b border-slate-100 pb-4 mb-4 text-center">
          <div className="text-xs font-bold text-slate-400 pt-1">
            W 24
          </div>
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col items-center">
              {d.active ? (
                <div className="px-4 py-1.5 rounded-2xl bg-[#141518] text-white shadow-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider">{d.day}</div>
                  <div className="text-sm font-black font-['Outfit']">{d.date}</div>
                </div>
              ) : (
                <div className="px-4 py-1 text-slate-600">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{d.day}</div>
                  <div className="text-xs font-bold">{d.date}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time Rows Grid */}
        <div className="space-y-6 min-w-[900px] text-xs">
          
          {/* Row 07:00 */}
          <div className="grid grid-cols-8 gap-4 items-start relative">
            <div className="text-slate-400 font-mono text-[11px] pt-1">07:00</div>
            
            {/* Monday card */}
            <div className="p-3 rounded-2xl bg-[#fdf2f4] border border-[#f9d6dd] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-pink-700">Code review</span>
              <div className="font-bold text-slate-900 mt-1">PR #42 Verification</div>
              <div className="text-[10px] text-slate-500">07:00 - 07:30</div>
            </div>

            {/* Tuesday card */}
            <div className="p-3 rounded-2xl bg-[#f4f2ec] border border-[#e5e1d5] space-y-2">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700">Standup</span>
              <div className="font-bold text-slate-900">Sprint Sync</div>
              <button className="w-full py-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                Join
              </button>
            </div>

            {/* Wednesday empty */}
            <div />

            {/* Thursday card */}
            <div className="p-3 rounded-2xl bg-[#eff6ff] border border-[#dbeafe] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-blue-700">In progress</span>
              <div className="font-bold text-slate-900">Token Auth Middleware</div>
              <div className="text-[10px] text-slate-500">07:00 - 08:30</div>
            </div>

            {/* Friday yellow card */}
            <div className="p-3 rounded-2xl bg-[#fefce8] border border-[#fef08a] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-amber-700">Milestone</span>
              <div className="font-bold text-slate-900">Team results & QA</div>
              <div className="text-[10px] text-slate-500">All departments</div>
            </div>

            {/* Sat & Sun */}
            <div />
            <div />
          </div>

          {/* Row 08:00 */}
          <div className="grid grid-cols-8 gap-4 items-start relative border-t border-dashed border-slate-200 pt-4">
            <div className="text-slate-400 font-mono text-[11px] pt-1">08:00</div>

            {/* Monday card */}
            <div className="p-3 rounded-2xl bg-[#fefce8] border border-[#fef08a] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-amber-700">Architecture</span>
              <div className="font-bold text-slate-900">Team Planning</div>
              <div className="text-[10px] text-slate-500">Room 202</div>
            </div>

            {/* Tuesday card */}
            <div className="p-3 rounded-2xl bg-[#f4f2ec] border border-[#e5e1d5] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700">Test</span>
              <div className="font-bold text-slate-900">Pytest Regression</div>
              <div className="text-[10px] text-slate-500">08:00 - 08:15</div>
            </div>

            {/* Wednesday card */}
            <div className="p-3 rounded-2xl bg-[#e6f4ea] border border-[#ceead6] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-emerald-800">Delivered</span>
              <div className="font-bold text-slate-900">Marketing Deck</div>
              <div className="text-[10px] text-slate-500">Figma & PDF</div>
            </div>

            {/* Thursday card */}
            <div className="p-3 rounded-2xl bg-[#eff6ff] border border-[#dbeafe] space-y-2">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-blue-700">AI / ML</span>
              <div className="font-bold text-slate-900">Llama 3 8B Evaluation</div>
              <div className="text-[10px] text-slate-500">Model Quantization</div>
              <button 
                onClick={() => onSelectTask(tasks.find(t => t.title.includes('Llama')) || tasks[0])}
                className="w-full py-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold"
              >
                Inspect
              </button>
            </div>

            {/* Friday card */}
            <div className="p-3 rounded-2xl bg-[#fdf2f4] border border-[#f9d6dd] space-y-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-pink-700">Emergency</span>
              <div className="font-bold text-slate-900">Blocker Review</div>
              <div className="text-[10px] text-slate-500">Quota Expansion</div>
            </div>

            {/* Sat card */}
            <div className="p-3 rounded-2xl bg-[#f4f2ec] border border-[#e5e1d5] space-y-2">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700">Sync</span>
              <div className="font-bold text-slate-900">Online Consultation</div>
              <button className="w-full py-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                Join
              </button>
            </div>

            {/* Sun */}
            <div />
          </div>

        </div>

      </div>

    </div>
  );
}
