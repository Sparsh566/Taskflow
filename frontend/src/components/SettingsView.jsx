import React, { useState } from 'react';
import { 
  User, Shield, Bell, Key, Palette, Save, CheckCircle2, 
  GitBranch, Laptop, Sliders, ExternalLink, RefreshCw 
} from 'lucide-react';

export default function SettingsView({ currentUser, onSwitchUser }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedToast, setSavedToast] = useState(false);

  // Form states initialized with currentUser data
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [githubUsername, setGithubUsername] = useState(currentUser?.github_username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  // Workflow preferences
  const [strictHeuristics, setStrictHeuristics] = useState(true);
  const [autoVerifyOnPR, setAutoVerifyOnPR] = useState(true);
  const [allowTrivialCommits, setAllowTrivialCommits] = useState(false);

  // Notification toggles
  const [notifyOnBlocker, setNotifyOnBlocker] = useState(true);
  const [notifyOnVerification, setNotifyOnVerification] = useState(true);
  const [notifyOnChatMessage, setNotifyOnChatMessage] = useState(true);

  // Integrations
  const [githubPat, setGithubPat] = useState('ghp_92jf9823kf02j98f23j0f98j23f9823jf');
  const [webhookUrl, setWebhookUrl] = useState('https://api.taskflow.dev/v1/github/webhook');

  const handleSave = (e) => {
    e?.preventDefault();
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-5xl select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Platform Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal profile, verification heuristics thresholds, notifications, and GitHub integrations.
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#e8e4da] pb-3 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile & Account', icon: User },
          { id: 'verification', label: 'Verification Engine', icon: Shield },
          { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
          { id: 'integrations', label: 'GitHub & Integrations', icon: GitBranch },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#141518] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile & Account */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="intelly-card p-6 rounded-3xl space-y-6">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
              User Profile & Role Identity
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt="Avatar Preview"
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-[#f4f2ec] shadow-sm shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{fullName || currentUser?.full_name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    currentUser?.role === 'manager'
                      ? 'bg-purple-100 text-purple-800'
                      : currentUser?.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser?.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Department: <strong className="text-slate-700">{currentUser?.department?.name || 'Central HQ'}</strong>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">User ID: {currentUser?.id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100 border border-[#e8e4da] rounded-xl px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-xl pl-7 pr-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Verification Engine */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="intelly-card p-6 rounded-3xl space-y-6">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
              Objective Work Verification & Heuristic Sensitivity
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Strict Whitespace & Comment Filtering
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Filters out formatting churn, indentation adjustments, and pure comment modifications from functional significance scores.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={strictHeuristics}
                  onChange={(e) => setStrictHeuristics(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Auto-Run Verification on GitHub PR Merge
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Automatically triggers diff heuristic engine calculations and acceptance criteria evaluation when a linked PR is merged.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoVerifyOnPR}
                  onChange={(e) => setAutoVerifyOnPR(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Flag Repetitive Commit Messages
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Applies a penalty multiplier to commits that repeat messages like "fix", "wip", or "update" without substantive functional deltas.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowTrivialCommits}
                  onChange={(e) => setAllowTrivialCommits(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Heuristics Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications & Alerts */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="intelly-card p-6 rounded-3xl space-y-6">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
              Notification & Real-time Alerts Channels
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Immediate Blocker Escalations
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Notify managers and department leads immediately when an employee flags a task blocker.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnBlocker}
                  onChange={(e) => setNotifyOnBlocker(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Verification Verdict Notifications
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Notify employees when their evidence or PR verification has been approved or rejected with manager notes.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnVerification}
                  onChange={(e) => setNotifyOnVerification(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#faf8f4] border border-[#e8e4da]">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Direct Web Chat Sounds & Badges
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Play a gentle audible ping and show unread badges when coworkers send you direct messages.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnChatMessage}
                  onChange={(e) => setNotifyOnChatMessage(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notification Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GitHub & Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="intelly-card p-6 rounded-3xl space-y-6">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
              GitHub Repositories & Webhook Endpoints
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connected Organization Repository
                </label>
                <div className="p-3 bg-[#faf8f4] border border-[#e8e4da] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-800">
                    <GitBranch className="w-4 h-4 text-pink-600" />
                    <span>taskflow-org/core-platform</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Connected & Syncing
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Payload URL
                </label>
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full bg-slate-100 border border-[#e8e4da] rounded-xl px-3.5 py-2 text-xs text-slate-600 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Configure this webhook on GitHub Settings &gt; Webhooks with event type <code>push</code> and <code>pull_request</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Update GitHub Integration</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
