import React, { useState } from 'react';
import { X, Sparkles, FolderPlus, GitBranch, Layers } from 'lucide-react';
import { api } from '../services/api';

const EMOJI_OPTIONS = ['🚀', '💻', '🎯', '⚡', '📱', '🌐', '🔒', '📦', '🤖', '📊', '🎨', '🧪'];

export default function CreateWorkspaceModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const newWs = await api.createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon,
        repository_url: repoUrl.trim() || undefined
      });

      onCreated(newWs);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not create workspace');
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
          <div className="w-10 h-10 rounded-2xl bg-[#141518] flex items-center justify-center text-xl shadow-sm">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Outfit']">
              Create Project Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Set up a dedicated workspace to track tasks, pull requests, and real team members.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Badge Icon
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === e
                      ? 'bg-[#141518] text-white scale-110 shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workspace / Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fintech Mobile MVP, AI RAG Pipeline, Q4 Marketing Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Description & Target Milestones
            </label>
            <textarea
              rows={3}
              placeholder="Summary of objectives, deliverables, and architecture..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
            />
          </div>

          {/* Connected GitHub Repo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-pink-600" />
              <span>Connected GitHub Repository (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. https://github.com/your-org/your-repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-[#fbf9f5] border border-[#e8e4da] rounded-2xl px-4 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={!name.trim() || submitting}
              className="px-5 py-2 rounded-full bg-[#141518] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Creating...' : 'Create Workspace'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
