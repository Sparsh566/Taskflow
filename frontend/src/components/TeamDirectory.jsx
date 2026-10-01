import React, { useState, useEffect } from 'react';
import { Users, Building, Shield, GitBranch, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function TeamDirectory() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deptRes, userRes] = await Promise.all([
        api.getDepartments(),
        api.getUsers()
      ]);
      setDepartments(deptRes);
      setUsers(userRes);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = selectedDept === 'all'
    ? users
    : users.filter(u => u.department_id === selectedDept);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Organizational Departments & Team Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Categorized technical and non-technical divisions with role-based governance.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDept === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Members ({users.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === d.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Departments Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="glass-panel p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                d.type === 'technical' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {d.type.replace('_', ' ')}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">[{d.code}]</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">{d.name}</h3>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{d.description}</p>
          </div>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="glass-panel glass-panel-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={user.full_name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                />
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                  user.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  user.role === 'manager' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {user.role}
                </span>
              </div>

              <h4 className="text-base font-bold text-white font-['Outfit']">
                {user.full_name}
              </h4>
              <div className="text-xs text-indigo-400 font-medium mt-0.5">
                {user.department?.name || 'Central Administration'}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.github_username && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-300 font-mono text-[11px]">@{user.github_username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Member
              </span>
              <span>Joined 2026</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
