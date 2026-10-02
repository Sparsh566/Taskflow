import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Mail, GitBranch, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function AddUserModal({ 
  onClose, 
  onCreated, 
  activeWorkspace = null 
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [githubUsername, setGithubUsername] = useState('');
  const [password, setPassword] = useState('emp123');
  const [addToWorkspace, setAddToWorkspace] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(depts);
      if (depts.length > 0) {
        setDepartmentId(depts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const newUser = await api.createUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        department_id: departmentId || undefined,
        github_username: githubUsername.trim() || undefined,
        password: password || 'emp123',
        workspace_id: addToWorkspace && activeWorkspace ? activeWorkspace.id : undefined
      });

      onCreated?.(newUser);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#141518] flex items-center justify-center text-white shadow-sm">
            <UserPlus className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Outfit']">
              Add Team Member
            </h2>
            <p className="text-xs text-slate-500">
              Create a real user for your project with role credentials, git link, and task assignments.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe, Maya Lin"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. user@yourproject.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Permission
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value === 'manager') setPassword('manager123');
                  else setPassword('emp123');
                }}
                className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="employee">Employee (Developer / Contributor)</option>
                <option value="manager">Manager (Reviews & Verification)</option>
                <option value="admin">Administrator (System Wide)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GitHub Handle & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Handle (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">@</span>
                <input
                  type="text"
                  placeholder="github-user"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl pl-7 pr-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Password
              </label>
              <input
                type="text"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Workspace Membership Checkbox */}
          {activeWorkspace && (
            <div className="flex items-center gap-2 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
              <input
                type="checkbox"
                id="ws-checkbox"
                checked={addToWorkspace}
                onChange={(e) => setAddToWorkspace(e.target.checked)}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
              />
              <label htmlFor="ws-checkbox" className="text-xs text-slate-700 cursor-pointer">
                Automatically add to active workspace: <strong>{activeWorkspace.name}</strong>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fullName.trim() || !email.trim() || submitting}
              className="px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating User...' : 'Add Team Member'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
