import React, { useState } from 'react';
import { X, Send, Plus, Trash2, FileText, CheckSquare } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
        
        <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-xl font-black text-white font-['Outfit']">
              Submit Work for Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Task: {task.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Submission Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Submission Summary & Notes
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what work was finished, how requirements were met, or any relevant context..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Acceptance Criteria Signoff */}
          {criteria.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Sign-off Acceptance Criteria
              </label>
              <div className="space-y-2">
                {criteria.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCriterion(idx)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={item.completed ? 'text-slate-200 font-semibold' : 'text-slate-400'}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document / Deliverable Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Deliverables & Supporting Proof
            </label>
            
            <div className="space-y-2 mb-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 uppercase">({doc.file_type})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new attachment form */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="col-span-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
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
                  placeholder="File or deliverable URL (e.g. https://drive.google.com/...)"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
                <button
                  type="button"
                  onClick={addDocument}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
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
