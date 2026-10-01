import React, { useState, useEffect } from 'react';
import { Users, Mail, GitBranch, Shield, ArrowUpRight } from 'lucide-react';
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
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Directory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Departments & Team Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role assignments, technical vs non-technical divisions, and member capacity.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedDept === 'all'
                ? 'bg-[#141518] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e8e4da]'
            }`}
          >
            All Members ({users.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedDept === d.id
                  ? 'bg-[#141518] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e8e4da]'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Departments Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="intelly-card p-4 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                d.type === 'technical' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
              }`}>
                {d.type.replace('_', ' ')}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">[{d.code}]</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{d.name}</h3>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="intelly-card intelly-card-hover p-6 rounded-3xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                  alt={user.full_name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  user.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                  user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {user.role}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                {user.full_name}
              </h4>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {user.department?.name || 'HQ / Central Team'}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.github_username && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-700 font-mono text-[11px]">@{user.github_username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Member
              </span>
              <span className="font-medium text-slate-400">Team 2026</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
