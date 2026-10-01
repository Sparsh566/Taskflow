import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Users, BarChart3, ShieldCheck, 
  GitBranch, FolderGit2, Settings, LogOut, ChevronDown, CheckCircle2 
} from 'lucide-react';

const PRESET_USERS = [
  { email: 'sarah.chen@taskflow.dev', name: 'Sarah Chen', role: 'manager', title: 'Tech Lead / Manager', dept: 'Engineering' },
  { email: 'marcus.vance@taskflow.dev', name: 'Marcus Vance', role: 'manager', title: 'Operations Director', dept: 'Operations' },
  { email: 'alex.dev@taskflow.dev', name: 'Alex Rivera', role: 'employee', title: 'Senior Engineer', dept: 'Engineering' },
  { email: 'priya.ai@taskflow.dev', name: 'Priya Patel', role: 'employee', title: 'AI/ML Researcher', dept: 'AI & ML' },
  { email: 'elena.growth@taskflow.dev', name: 'Elena Rostova', role: 'employee', title: 'Growth Marketing', dept: 'Marketing' },
  { email: 'admin@taskflow.dev', name: 'System Admin', role: 'admin', title: 'Global Admin', dept: 'HQ' },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onSwitchUser 
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <aside className="w-64 h-[calc(100vh-24px)] m-3 sticky top-3 rounded-3xl bg-[#141518] text-slate-300 flex flex-col justify-between p-5 select-none shadow-2xl shrink-0 z-30">
      
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight font-['Outfit'] lowercase">
              taskflow
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          </div>
        </div>

        {/* Section: General */}
        <div className="space-y-1 mb-8">
          <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            General
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule & Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'tasks'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Task Board</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Employees & Depts</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'verification'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span>Work Verification</span>
          </button>
        </div>

        {/* Section: Tools */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tools
          </div>

          <button
            onClick={() => setActiveTab('github')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'github'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>GitHub Repos & PRs</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'documents'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Documents Base</span>
          </button>

          <button
            onClick={() => alert("TaskFlow Settings configured: Role policies, GitHub webhooks, notification channels.")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1a1b20] transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Bottom User Persona & Logout */}
      <div className="relative pt-4 border-t border-slate-800">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="w-full flex items-center justify-between p-2 rounded-2xl bg-[#1d1f24] hover:bg-[#25272e] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.full_name}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.full_name}
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {currentUser?.role}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Persona Dropdown Popover */}
        {showUserDropdown && (
          <div className="absolute bottom-16 left-0 w-64 rounded-2xl bg-[#1a1b20] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
            <div className="px-3 py-2 border-b border-slate-800 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role / Persona
              </span>
            </div>
            <div className="space-y-1">
              {PRESET_USERS.map((u) => {
                const isSelected = currentUser?.email === u.email;
                return (
                  <button
                    key={u.email}
                    onClick={() => {
                      onSwitchUser(u.email);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-pink-600/20 text-white border border-pink-500/30'
                        : 'text-slate-300 hover:bg-[#24262c]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.title}</div>
                    </div>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}
