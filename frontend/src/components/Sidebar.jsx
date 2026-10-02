import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, Users, BarChart3, ShieldCheck, 
  GitBranch, FolderGit2, Settings, LogOut, ChevronDown, CheckCircle2,
  MessageSquare, Plus, Check, Briefcase
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
  onSwitchUser,
  unreadChatCount = 0,
  workspaces = [],
  activeWorkspace = null,
  onSelectWorkspace = () => {},
  onOpenCreateWorkspace = () => {}
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  return (
    <aside className="w-64 h-[calc(100vh-24px)] m-3 sticky top-3 rounded-3xl bg-[#141518] text-slate-300 flex flex-col justify-between p-5 select-none shadow-2xl shrink-0 z-30">
      
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tight font-['Outfit'] lowercase">
              taskflow
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
          </div>
        </div>

        {/* Workspace Switcher Selector */}
        <div className="relative mb-6">
          <button
            onClick={() => {
              setShowWorkspaceDropdown(!showWorkspaceDropdown);
              setShowUserDropdown(false);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#1d1f24] hover:bg-[#25272e] border border-slate-800 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform shrink-0">
                {activeWorkspace?.icon || '🚀'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {activeWorkspace?.name || 'TaskFlow Core'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {activeWorkspace?.repository_url ? 'Connected to GitHub' : 'Project Workspace'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Workspace Dropdown Popover */}
          {showWorkspaceDropdown && (
            <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl bg-[#1a1b20] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Projects ({workspaces.length})
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                {workspaces.map((ws) => {
                  const isSelected = activeWorkspace?.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws);
                        setShowWorkspaceDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-pink-600/20 text-white border border-pink-500/30'
                          : 'text-slate-300 hover:bg-[#24262c]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{ws.icon || '🚀'}</span>
                        <div className="truncate">
                          <div className="font-semibold truncate">{ws.name}</div>
                          {ws.member_count > 0 && (
                            <div className="text-[9px] text-slate-400">{ws.member_count} member{ws.member_count > 1 ? 's' : ''}</div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    onOpenCreateWorkspace();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-pink-400 hover:bg-pink-500/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create Workspace</span>
                </button>
              </div>
            </div>
          )}
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
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <span>Direct Chat</span>
            </div>
            {unreadChatCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
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
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#22242a] text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
            }`}
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
