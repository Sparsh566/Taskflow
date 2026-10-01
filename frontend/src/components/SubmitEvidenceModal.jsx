import React, { useState } from 'react';
import { X, Send, Plus, Trash2, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function SubmitEvidenceModal({ task, onClose, onSubmitted }) {
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [documents, setDocuments] = useState([
    { title: 'Project Deliverable Spec / Document', file_type: 'pdf', file_url: 'https://storage.taskflow.dev/deliverables/spec_final.pdf' }
  ]);
  const [criteria, setCriteria] = useState(
    task.acceptance_criteria?.map(c => ({ ...c })) || []
  );
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const toggleCriterion = (idx) => {
    const updated = [...criteria];
    updated[idx].completed = !updated[idx].completed;
    setCriteria(updated);
  };

  const addDocument = () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;
    setDocuments([...documents, { title: newDocTitle, file_url: newDocUrl, file_type: newDocType }]);
    setNewDocTitle('');
    setNewDocUrl('');
  };

  const removeDoc = (idx) => {
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.submitEvidence(task.id, {
        submission_notes: submissionNotes,
        documents: documents,
        criteria_updates: criteria
      });
      onSubmitted();
      onClose();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 sm:p-8 text-slate-800">
        
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">
              Submit Work for Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Task: {task.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Submission Summary & Notes
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe deliverables and how acceptance criteria were satisfied..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
            />
          </div>

          {criteria.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Sign-off Acceptance Criteria
              </label>
              <div className="space-y-2">
                {criteria.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCriterion(idx)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <span className={item.completed ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Deliverables & Supporting Proof
            </label>
            
            <div className="space-y-2 mb-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-pink-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-400 uppercase">({doc.file_type})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="col-span-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800"
                >
                  <option value="pdf">PDF</option>
                  <option value="link">URL / Link</option>
                  <option value="docx">DOCX</option>
                  <option value="sheet">Spreadsheet</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="File or deliverable URL..."
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800"
                />
                <button
                  type="button"
                  onClick={addDocument}
                  className="px-4 py-1.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit Deliverables for Review'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
