import React, { useState } from 'react';
import { 
  CheckCircle2, Bell, Plus, Users, Shield, 
  GitBranch, Sparkles, ChevronDown 
} from 'lucide-react';

const PRESET_USERS = [
  { email: 'sarah.chen@taskflow.dev', name: 'Sarah Chen', role: 'manager', title: 'Tech Lead / Manager (ENG)', dept: 'Engineering' },
  { email: 'marcus.vance@taskflow.dev', name: 'Marcus Vance', role: 'manager', title: 'Operations Director (OPS)', dept: 'Operations' },
  { email: 'alex.dev@taskflow.dev', name: 'Alex Rivera', role: 'employee', title: 'Senior Software Engineer', dept: 'Engineering' },
  { email: 'priya.ai@taskflow.dev', name: 'Priya Patel', role: 'employee', title: 'AI/ML Research Engineer', dept: 'AI & Machine Learning' },
  { email: 'elena.growth@taskflow.dev', name: 'Elena Rostova', role: 'employee', title: 'Growth & Product Marketing', dept: 'Marketing & Growth' },
  { email: 'admin@taskflow.dev', name: 'System Administrator', role: 'admin', title: 'Global System Admin', dept: 'HQ' },
];

export default function Header({ 
  currentUser, 
  onSwitchUser, 
  notifications, 
  onMarkNotificationRead, 
  onOpenCreateTask,
  activeTab,
  setActiveTab 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">
                    Task<span className="text-indigo-400">Flow</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Work Verification & Task Management
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Manager Analytics
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Task Board
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'team'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Departments & Team
              </button>
            </nav>
          </div>

          {/* Right Action Icons & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* New Task Button (Visible to managers and admin) */}
            {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
              <button
                onClick={onOpenCreateTask}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Task</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Notifications ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] text-indigo-400 font-medium">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No notifications yet</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-colors ${
                            notif.is_read
                              ? 'bg-slate-950/40 border border-slate-800/40 text-slate-400'
                              : 'bg-indigo-950/30 border border-indigo-500/30 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-200">{notif.title}</h4>
                            <span className="text-[10px] text-slate-500">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left"
              >
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser?.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/40"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser?.full_name?.split(' ')[0]}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    {currentUser?.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Switch Role & Persona
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Instantly test employee vs manager capabilities
                    </p>
                  </div>
                  <div className="space-y-1">
                    {PRESET_USERS.map((u) => {
                      const isSelected = currentUser?.email === u.email;
                      return (
                        <button
                          key={u.email}
                          onClick={() => {
                            onSwitchUser(u.email);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/30 text-white'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              {u.name}
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.title}</div>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.role === 'manager'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
