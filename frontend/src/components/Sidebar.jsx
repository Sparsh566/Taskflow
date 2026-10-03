import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Users, BarChart3, ShieldCheck, 
  GitBranch, FolderGit2, Settings, LogOut, ChevronDown, CheckCircle2,
  MessageSquare, Plus, Check, Briefcase, ChevronLeft, ChevronRight,
  ShieldAlert, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const PRESET_USERS = [
  { email: 'sarah.chen@taskflow.dev', name: 'Sarah Chen', role: 'manager', title: 'Tech Lead / Manager', dept: 'Engineering' },
  { email: 'marcus.vance@taskflow.dev', name: 'Marcus Vance', role: 'manager', title: 'Operations Director', dept: 'Operations' },
  { email: 'alex.dev@taskflow.dev', name: 'Alex Rivera', role: 'employee', title: 'Senior Engineer', dept: 'Engineering' },
  { email: 'priya.ai@taskflow.dev', name: 'Priya Patel', role: 'employee', title: 'AI/ML Researcher', dept: 'AI & ML' },
  { email: 'elena.growth@taskflow.dev', name: 'Elena Rostova', role: 'employee', title: 'Growth Marketing', dept: 'Marketing' },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onSwitchUser,
  onLogout = () => {},
  unreadChatCount = 0,
  workspaces = [],
  activeWorkspace = null,
  onSelectWorkspace = () => {},
  onOpenCreateWorkspace = () => {},
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setInternalCollapsed(next);
    localStorage.setItem('taskflow_sidebar_collapsed', String(next));
    if (controlledToggle) controlledToggle(next);
  };

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const NavItem = ({ id, label, icon: Icon, badge = null, adminOnly = false }) => {
    const isActive = activeTab === id;
    return (
      <div className="relative group">
        <button
          onClick={() => setActiveTab(id)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
          } rounded-xl text-xs font-medium transition-all duration-200 ${
            isActive
              ? adminOnly
                ? 'bg-red-950/40 text-red-300 font-semibold border border-red-500/30 shadow-inner'
                : 'bg-[#22242a] text-white font-semibold shadow-inner'
              : adminOnly
                ? 'text-red-400/80 hover:text-red-300 hover:bg-red-950/20'
                : 'text-slate-400 hover:text-white hover:bg-[#1a1b20]'
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Icon className={`w-4 h-4 shrink-0 ${adminOnly ? 'text-red-400' : (id === 'messages' || id === 'verification' ? 'text-pink-400' : '')}`} />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>

          {!isCollapsed && badge && (
            <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {badge}
            </span>
          )}
        </button>

        {/* Collapsed Mode Floating Tooltip */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#1d1f24] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-1.5">
            <span>{label}</span>
            {badge && (
              <span className="w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20 p-3' : 'w-64 p-5'
      } h-[calc(100vh-24px)] m-3 sticky top-3 rounded-3xl bg-[#141518] text-slate-300 flex flex-col justify-between select-none shadow-2xl shrink-0 z-30 transition-all duration-300 ease-in-out`}
    >
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col h-full min-h-0">
        
        {/* Brand Header with Retractable Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} px-1 py-2 mb-4`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tracking-tight font-['Outfit'] lowercase">
                  taskflow
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              </div>

              <button
                onClick={toggleCollapse}
                title="Collapse sidebar rail"
                className="p-1.5 rounded-xl hover:bg-[#22242a] text-slate-400 hover:text-white transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleCollapse}
              title="Expand sidebar"
              className="p-2 rounded-2xl bg-[#1d1f24] hover:bg-[#25272e] text-slate-300 hover:text-white transition-all shadow-md group relative"
            >
              <PanelLeftOpen className="w-4 h-4" />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#1d1f24] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Expand Sidebar
              </div>
            </button>
          )}
        </div>

        {/* Workspace Switcher Selector */}
        {!isCollapsed ? (
          <div className="relative mb-5">
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
        ) : (
          <div className="relative mb-4 flex justify-center group">
            <button
              onClick={() => onOpenCreateWorkspace()}
              className="w-10 h-10 rounded-2xl bg-[#1d1f24] hover:bg-[#25272e] flex items-center justify-center text-lg shadow-sm border border-slate-800 transition-all"
            >
              {activeWorkspace?.icon || '🚀'}
            </button>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#1d1f24] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {activeWorkspace?.name || 'Workspace'}
            </div>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 pr-0.5 custom-scrollbar">
          
          {/* General Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                General
              </div>
            )}

            <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
            <NavItem id="schedule" label="Schedule & Timeline" icon={Calendar} />
            <NavItem id="tasks" label="Task Board" icon={CheckCircle2} />
            <NavItem id="messages" label="Direct Chat" icon={MessageSquare} badge={unreadChatCount > 0 ? unreadChatCount : null} />
            <NavItem id="team" label="Employees & Depts" icon={Users} />
            <NavItem id="verification" label="Work Verification" icon={ShieldCheck} />
          </div>

          {/* Tools Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tools
              </div>
            )}

            <NavItem id="github" label="GitHub Repos & PRs" icon={GitBranch} />
            <NavItem id="documents" label="Documents Base" icon={FolderGit2} />
            <NavItem id="settings" label="Settings" icon={Settings} />
          </div>

          {/* Isolated Master Session Section (Only rendered when authenticated as master admin) */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-red-900/40">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-black text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Master Core</span>
                </div>
              )}
              <NavItem id="admin" label="Master Console" icon={ShieldAlert} adminOnly={true} />
            </div>
          )}

        </div>
      </div>

      {/* Bottom User Persona & Logout Controls */}
      <div className="relative pt-3 border-t border-slate-800 shrink-0">
        
        {!isCollapsed ? (
          <div className="space-y-2">
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

            {/* Persona Switcher Dropdown (Sandbox Only: Manager & Employee) */}
            {showUserDropdown && (
              <div className="absolute bottom-20 left-0 w-64 rounded-2xl bg-[#1a1b20] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Sandbox Persona
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

            {/* Explicit Logout Action */}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {/* Collapsed Avatar */}
            <div className="relative group">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser?.full_name}
                className="w-9 h-9 rounded-2xl object-cover ring-1 ring-slate-700 shrink-0 cursor-pointer"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#1d1f24] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {currentUser?.full_name} ({currentUser?.role})
              </div>
            </div>

            {/* Collapsed Logout */}
            <div className="relative group">
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-[#1d1f24] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Sign Out
              </div>
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
