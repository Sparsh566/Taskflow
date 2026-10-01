import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, GitBranch, FileText, CheckSquare } from 'lucide-react';
import { api } from '../services/api';

export default function CreateTaskModal({ onClose, onCreated, currentUser }) {
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [verificationType, setVerificationType] = useState('github_code');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [githubRepo, setGithubRepo] = useState('taskflow-org/core-platform');
  const [branchName, setBranchName] = useState('');
  const [criteria, setCriteria] = useState([
    { id: '1', text: 'Unit tests cover all core edge cases', completed: false },
    { id: '2', text: 'Documentation and API specs updated', completed: false }
  ]);
  const [newCriterion, setNewCriterion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        api.getDepartments(),
        api.getUsers()
      ]);
      setDepartments(deptRes);
      setUsers(usersRes.filter(u => u.role === 'employee'));

      if (deptRes.length > 0) {
        setDepartmentId(deptRes[0].id);
        const catRes = await api.getCategories(deptRes[0].id);
        setCategories(catRes);
        if (catRes.length > 0) setCategoryId(catRes[0].id);
      }
    } catch (err) {
      console.error('Failed loading metadata:', err);
    }
  };

  const handleDepartmentChange = async (deptId) => {
    setDepartmentId(deptId);
    try {
      const catRes = await api.getCategories(deptId);
      setCategories(catRes);
      if (catRes.length > 0) setCategoryId(catRes[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const addCriterion = () => {
    if (!newCriterion.trim()) return;
    setCriteria([...criteria, { id: String(Date.now()), text: newCriterion.trim(), completed: false }]);
    setNewCriterion('');
  };

  const removeCriterion = (id) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    try {
      setLoading(true);
      await api.createTask({
        title,
        description,
        category_id: categoryId || null,
        priority,
        verification_type: verificationType,
        acceptance_criteria: criteria,
        deadline: new Date(deadline).toISOString(),
        assignee_ids: assigneeId ? [assigneeId] : [],
        github_repo: verificationType === 'github_code' ? githubRepo : null,
        branch_name: verificationType === 'github_code' ? (branchName || `task/${Date.now().toString().slice(-6)}`) : null
      });

      onCreated();
      onClose();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-xl font-black text-white font-['Outfit']">
              Create New Employee Task
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign work with explicit acceptance criteria and verification requirements.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement WebSocket Deadlines Notification Stream"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Detail the expected workflow, requirements, and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Verification Model</label>
              <select
                value={verificationType}
                onChange={(e) => setVerificationType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="github_code">GitHub Code Verification</option>
                <option value="document_deliverable">Document / File Deliverable</option>
                <option value="checklist">Checklist Acceptance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Assignee</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Target Deadline</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* GitHub Config if Technical */}
          {verificationType === 'github_code' && (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <GitBranch className="w-4 h-4" />
                GitHub Repository & Branch Tracking
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Repo name (e.g. taskflow-org/core-platform)"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Branch name (e.g. feature/ENG-204)"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Dynamic Acceptance Criteria */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Acceptance Criteria Checklist
            </label>
            <div className="space-y-2 mb-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-200">• {c.text}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add acceptance criterion item..."
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCriterion(); } }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCriterion}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Creating Task...' : 'Confirm & Assign Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
