import React, { useState } from 'react';
import { Search, Bell, Plus, Settings, User, MessageSquare } from 'lucide-react';

export default function TopBar({ 
  onOpenCreateTask, 
  notifications, 
  onMarkNotificationRead, 
  currentUser,
  onNavigate,
  unreadChatCount = 0
}) {
  const [showNotif, setShowNotif] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-3 px-6 select-none">
      
      {/* Search Capsule Bar with category filters */}
      <div className="flex-1 max-w-2xl w-full flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-[#e8e4da] shadow-sm">
        <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
          <Search className="w-3.5 h-3.5 text-pink-600" />
        </div>
        
        <input
          type="text"
          placeholder="Search team tasks, pull requests, acceptance criteria..."
          className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Filter tags inside search bar */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 border-l border-slate-200 pl-3 shrink-0">
          <span className="font-semibold text-slate-400">In:</span>
          {['Tasks', 'Engineering', 'AI/ML', 'PRs'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                activeFilter === tag
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Add Task Button + Dark Action Capsule */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Black Add Task Pill Button */}
        {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}

        {/* Action Capsule from reference UI */}
        <div className="relative flex items-center gap-3 bg-[#141518] px-3.5 py-1.5 rounded-full shadow-md">
          {/* User Icon */}
          <button
            onClick={() => onNavigate?.('settings')}
            title="Profile & Settings"
            className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-slate-700 hover:ring-pink-500 transition-colors"
          >
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser?.full_name}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Messages Quick Icon */}
          <button
            onClick={() => onNavigate?.('messages')}
            title="Direct Messages"
            className="relative text-slate-300 hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Bell Icon */}
          <button
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
            className="relative text-slate-300 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Settings Icon */}
          <button
            onClick={() => onNavigate?.('settings')}
            title="Settings"
            className="text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Notifications ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <span className="text-[11px] text-pink-600 font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-colors ${
                        notif.is_read
                          ? 'bg-slate-50 text-slate-500'
                          : 'bg-pink-50 text-slate-900 border border-pink-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
