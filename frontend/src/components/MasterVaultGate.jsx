import React, { useState } from 'react';
import { 
  ShieldAlert, Lock, KeyRound, Terminal, Cpu, ArrowRight, 
  RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function MasterVaultGate({ onVaultSuccess, onExit }) {
  const [adminId, setAdminId] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [accessPasscode, setAccessPasscode] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accessAttempts, setAccessAttempts] = useState(0);

  const handleVaultAuth = async (e) => {
    e.preventDefault();
    if (!adminId || !masterKey) {
      setError('CLASSIFIED: Master Identifier and Security Key required.');
      return;
    }

    if (accessAttempts >= 5) {
      setError('SECURITY PROTOCOL ACTIVATED: Gateway locked due to excessive failed attempts.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await api.vaultAuth(
        adminId.trim(),
        masterKey.trim(),
        accessPasscode.trim() || null
      );
      setAuthToken(data.access_token);
      onVaultSuccess(data.user, data.access_token);
    } catch (err) {
      setAccessAttempts(prev => prev + 1);
      setError(err.message || 'Security clearance rejected. Invalid signature.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#08090b] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-mono relative overflow-hidden select-none">
      
      {/* Stealth Matrix / Dark Cyber Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Vault Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0f1015]/95 border border-red-900/40 shadow-2xl p-7 sm:p-9 space-y-6 backdrop-blur-2xl">
        
        {/* Classified Top Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-red-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>RESTRICTED ACCESS // NODE-K7V</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                TaskFlow Cryptographic Master Vault
              </div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="text-[10px] text-slate-500 hover:text-slate-300 font-sans hover:underline"
          >
            ← Exit Gateway
          </button>
        </div>

        {/* Warning Badge */}
        <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/20 text-[11px] text-red-300/90 leading-relaxed font-sans flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>
            This cryptographic gateway is hidden from public indexing. Unauthorized probing will result in IP-level hardware quarantine.
          </span>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-900/40 border border-red-500 text-red-200 text-xs font-sans flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Vault Form */}
        <form onSubmit={handleVaultAuth} className="space-y-4">
          
          {/* Master Admin ID */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Master Admin Identity (Gmail ID)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="106.jedi.master@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#14151c] border border-red-950/60 focus:border-red-500 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Master Cryptographic Key */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Master Cryptographic Security Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                required
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#14151c] border border-red-950/60 focus:border-red-500 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Passcode Token (Optional dual-factor) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Access Passcode / Security Token (Optional)
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accessPasscode}
                onChange={(e) => setAccessPasscode(e.target.value)}
                placeholder="TF_JEDI_MASTER_KEY_7721"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#14151c] border border-red-950/60 focus:border-red-500 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-red-700/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Verifying Cryptographic Clearance...</span>
              </>
            ) : (
              <>
                <span>Execute Vault Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Footer Audit Code */}
        <div className="pt-3 border-t border-red-900/30 flex items-center justify-between text-[10px] text-slate-500">
          <span>SEC-GATEWAY: K7V-90210</span>
          <span>E2EE TOKEN ENCRYPTION</span>
        </div>

      </div>

    </div>
  );
}
