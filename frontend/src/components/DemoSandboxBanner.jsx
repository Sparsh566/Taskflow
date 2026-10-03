import React, { useState } from 'react';
import { ShieldCheck, UserCheck, RefreshCw, Info, X, ExternalLink, Check, Sparkles } from 'lucide-react';

const DEMO_PERSONAS = [
  {
    role: 'manager',
    email: 'sarah.chen@taskflow.dev',
    label: 'Manager',
    name: 'Sarah Chen',
    title: 'Tech Lead / Reviewer',
    badge: 'Approver',
    color: 'from-pink-500 to-rose-500',
    description: 'Inspects code diffs, evaluates heuristic scores, approves or requests revisions on tasks.'
  },
  {
    role: 'employee',
    email: 'alex.dev@taskflow.dev',
    label: 'Employee',
    name: 'Alex Rivera',
    title: 'Senior Engineer',
    badge: 'Contributor',
    color: 'from-blue-500 to-indigo-500',
    description: 'Pushes code, tracks acceptance checklists, resolves blockers, and submits deliverable evidence.'
  }
];

export default function DemoSandboxBanner({ currentUser, onSwitchUser }) {
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [switchingEmail, setSwitchingEmail] = useState(null);

  const handleSwitch = async (email) => {
    if (currentUser?.email === email) return;
    setSwitchingEmail(email);
    try {
      await onSwitchUser(email);
    } finally {
      setSwitchingEmail(null);
    }
  };

  return (
    <>
      {/* Top Floating / Embedded Demo Bar */}
      <div className="mx-6 mb-4 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white border border-[#e8e4da] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 select-none">
        
        {/* Left: Sandbox Verification Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Sandbox Preview</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Synthetic Data Environment</span>
            <span>•</span>
            <span className="text-slate-500">Safe sandbox with simulated diffs & mock tasks</span>
          </div>

          <button
            onClick={() => setShowTrustModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline transition-colors ml-1"
            title="Learn about TaskFlow demo trust guarantees"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Trust Guarantee</span>
          </button>
        </div>

        {/* Right: 1-Click Persona Switcher */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto justify-end overflow-x-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Try 1-Click Demo:
          </span>

          {DEMO_PERSONAS.map((persona) => {
            const isActive = currentUser?.email === persona.email;
            const isSwitching = switchingEmail === persona.email;

            return (
              <button
                key={persona.email}
                onClick={() => handleSwitch(persona.email)}
                disabled={isSwitching}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#141518] text-white shadow-md ring-2 ring-pink-500/50'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200/60'
                }`}
                title={`Switch immediately to ${persona.name} (${persona.title})`}
              >
                {isSwitching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
                ) : isActive ? (
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{persona.label}</span>
                <span className={`hidden md:inline text-[10px] font-normal ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  ({persona.name.split(' ')[0]})
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Trust & Privacy Guarantee Modal */}
      {showTrustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#e8e4da] shadow-2xl p-6 sm:p-7 text-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-['Outfit']">
                    Live Demo Trust & Privacy Guarantee
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Why your credentials and private code remain 100% secure.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTrustModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  1. Isolated Demo Sandbox
                </div>
                <p>
                  This live deployment runs on an isolated sandbox database populated with synthetic companies, dummy commit diffs, and simulated deliverable artifacts.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  2. Zero Access to Real Private Repositories
                </div>
                <p>
                  No GitHub Personal Access Tokens or proprietary codebases are required to test the heuristic engine. You can simulate real and spam commits in real-time inside the Verification Workbench.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  3. Instant Persona Switching
                </div>
                <p>
                  Recruiters and hiring managers do not need to manually copy credentials from documentation. Use the 1-click buttons to evaluate Manager, Employee, and Admin views with real permissions.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Current persona: <b className="text-slate-700">{currentUser?.full_name} ({currentUser?.role})</b>
              </span>
              <button
                onClick={() => setShowTrustModal(false)}
                className="px-4 py-2 rounded-full bg-[#141518] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
