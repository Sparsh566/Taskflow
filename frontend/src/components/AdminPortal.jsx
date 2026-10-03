import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Database, FileText, RefreshCw, KeyRound, 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Activity, 
  ArrowUpRight, Plus, Lock, Check, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPortal({ currentUser, onOpenAddUser }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('users'); // 'users' | 'audit' | 'health' | 'sandbox'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dbHealth, setDbHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [resettingSandbox, setResettingSandbox] = useState(false);

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, logsData, healthData] = await Promise.all([
        api.getAdminUsers(),
        api.getAuditLogs(40),
        api.getDbHealth(),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
      setDbHealth(healthData);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const notifyAction = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      notifyAction(res.message);
      // Refresh audit logs in background
      api.getAuditLogs(40).then(setAuditLogs);
    } catch (err) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      const res = await api.updateUserStatus(user.id, nextStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: nextStatus } : u));
      notifyAction(res.message);
      api.getAuditLogs(40).then(setAuditLogs);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword) return;
    setResetLoading(true);
    try {
      const res = await api.resetUserPassword(resetTargetUser.id, newPassword);
      notifyAction(res.message);
      setResetTargetUser(null);
      setNewPassword('');
    } catch (err) {
      alert(`Password reset failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSandboxReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all sandbox telemetry? This will clear test activity logs, chat records, and reset demo tasks to a clean state.'
    );
    if (!confirmed) return;

    setResettingSandbox(true);
    try {
      const res = await api.resetSandbox();
      notifyAction(res.message);
      await loadAllAdminData();
    } catch (err) {
      alert(`Sandbox reset failed: ${err.message}`);
    } finally {
      setResettingSandbox(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Admin Header with Master Shield Badge */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#14151a] via-[#1c1d24] to-[#14151a] border border-red-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white font-['Outfit']">
                TaskFlow Hardened Admin Console
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-500/40">
                Restricted Owner Zone
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Session: <b className="text-white">{currentUser?.email}</b> • Full administrative jurisdiction over accounts, cloud database, and verification audit trails.
            </p>
          </div>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#22242c] hover:bg-[#2c2f38] text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pink-400' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e8e4da] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'users'
              ? 'bg-[#141518] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Access Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'audit'
              ? 'bg-[#141518] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Log ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('health')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'health'
              ? 'bg-[#141518] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Cloud Health</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'sandbox'
              ? 'bg-[#141518] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Sandbox Controls</span>
        </button>
      </div>

      {/* Sub-Tab 1: User & Access Management */}
      {activeAdminSubTab === 'users' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                System Accounts & Privileges
              </h3>
              <p className="text-xs text-slate-500">
                Grant or revoke manager verification rights, change team member roles, or trigger credential resets.
              </p>
            </div>

            <button
              onClick={onOpenAddUser}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Member</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-[#e8e4da] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-[#e8e4da] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Tasks</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Member Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={u.full_name}
                              className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.full_name}</span>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-100 text-pink-700 font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="py-3.5 px-4">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {u.department_name}
                        </td>

                        {/* Assigned Tasks */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {u.assigned_tasks_count}
                          </span>
                        </td>

                        {/* Active Status Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(u)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                          </button>
                        </td>

                        {/* Reset Password Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPassword('');
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                            title="Reset password for this user"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Reset</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Sub-Tab 2: Security & Audit Logs */}
      {activeAdminSubTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 font-['Outfit']">
              Chronological Security & Telemetry Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Audit log capturing verification reviews, manager overrides, dispute actions, role changes, and admin interventions.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-[#e8e4da] shadow-sm p-4 divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600 font-medium">Actor: {log.actor_email}</span>
                      {log.metadata && (
                        <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2 font-mono">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Database & Cloud Health */}
      {activeAdminSubTab === 'health' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 font-['Outfit']">
              Supabase Cloud PostgreSQL & Infrastructure Status
            </h3>
            <p className="text-xs text-slate-500">
              Live database connection diagnostics, dialect parameters, pool statistics, and entity record metrics.
            </p>
          </div>

          {dbHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Dialect & Latency Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#e8e4da] shadow-sm space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Engine Telemetry</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-['Outfit']">
                  {dbHealth.latency_ms} <span className="text-sm font-semibold text-slate-400">ms</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Dialect:</span>
                    <b className="font-mono text-slate-800 uppercase">{dbHealth.pool?.dialect}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Supabase Cloud:</span>
                    <b className={dbHealth.pool?.is_supabase_cloud ? 'text-emerald-600' : 'text-slate-600'}>
                      {dbHealth.pool?.is_supabase_cloud ? 'Connected (PostgreSQL)' : 'Local Zero-Dependency (SQLite)'}
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Type:</span>
                    <span className="font-mono text-[10px] text-slate-500">{dbHealth.pool?.pool_type}</span>
                  </div>
                </div>
              </div>

              {/* Record Counts Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#e8e4da] shadow-sm space-y-3 md:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Entity Metrics
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
                  {Object.entries(dbHealth.record_counts || {}).map(([key, count]) => (
                    <div key={key} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-lg font-black text-slate-900 font-['Outfit']">
                        {count}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 capitalize">
                        {key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">Loading diagnostics...</div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Sandbox & Emergency Controls */}
      {activeAdminSubTab === 'sandbox' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 font-['Outfit']">
              Demo Sandbox Maintenance & State Reset
            </h3>
            <p className="text-xs text-slate-500">
              Restore the live evaluation environment to a clean baseline prior to recruiter reviews or product demonstrations.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e8e4da] shadow-sm space-y-4 max-w-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Reset Demo Sandbox Telemetry
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This action purges temporary chat logs, blocker events, and resets demo tasks back to their baseline verification states. Company workspaces, user accounts, and core department structures are preserved.
                </p>
              </div>
            </div>

            <button
              onClick={handleSandboxReset}
              disabled={resettingSandbox}
              className="px-5 py-2.5 rounded-2xl bg-[#141518] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resettingSandbox ? 'animate-spin text-pink-400' : ''}`} />
              <span>{resettingSandbox ? 'Resetting Sandbox...' : 'Reset Sandbox to Clean Baseline'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal Popover */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 text-slate-900 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-black font-['Outfit']">
                  Reset Password for Member
                </h3>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Target Account: <b>{resetTargetUser.full_name}</b> ({resetTargetUser.email})
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md"
                >
                  {resetLoading ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
