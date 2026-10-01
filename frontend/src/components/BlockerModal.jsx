import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function BlockerModal({ task, onClose, onReported }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await api.reportBlocker(task.id, reason);
      onReported();
      onClose();
    } catch (err) {
      alert(`Failed to report blocker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl p-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white font-['Outfit']">Report Task Blocker</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-xs text-slate-300 font-semibold mb-1">
              Task: {task.title}
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Reporting a blocker will alert your manager immediately and mark the task status as Blocked.
            </p>

            <textarea
              rows={4}
              required
              placeholder="Explain the impediment, dependencies required, or technical blocker..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
            >
              {loading ? 'Submitting...' : 'Confirm Blocker Escalation'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
