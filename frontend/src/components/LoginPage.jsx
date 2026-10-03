import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, 
  GitBranch, FileText, UserCheck, ShieldAlert, RefreshCw, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [activeMode, setActiveMode] = useState('credentials'); // 'credentials' | 'sandbox'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sandboxLoadingRole, setSandboxLoadingRole] = useState(null);
  const [error, setError] = useState(null);

  const handleDirectLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      setAuthToken(data.access_token);
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxLaunch = async (personaEmail, roleKey) => {
    setError(null);
    setSandboxLoadingRole(roleKey);

    try {
      const data = await api.switchPersona(personaEmail);
      setAuthToken(data.access_token);
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      // Fallback
      try {
        const pwd = roleKey === 'manager' ? 'manager123' : 'emp123';
        const data = await api.login(personaEmail, pwd);
        setAuthToken(data.access_token);
        onLoginSuccess(data.user, data.access_token);
      } catch (fallbackErr) {
        setError(fallbackErr.message || 'Could not launch sandbox session.');
      }
    } finally {
      setSandboxLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Inter'] relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#14151a]/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Hero / Brand Showcase (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#181920] to-[#111216] p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <span className="text-3xl font-black text-white tracking-tight font-['Outfit'] lowercase">
                taskflow
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                Phase 2 Core
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight font-['Outfit'] leading-snug mb-3">
              Autonomous Work Verification & Task Telemetry
            </h2>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-8">
              Prevent sprint churn with deterministic heuristic scoring, automated AST diff inspection, multi-signal CI validation, and human-in-the-loop review.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Signal Verification</h4>
                  <p className="text-[11px] text-slate-400">CI telemetry, test coverage reports, PR merge confirmation, and diff heuristics.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI-Assisted Deliverable Advisory</h4>
                  <p className="text-[11px] text-slate-400">Smart comparison between task acceptance criteria and code commits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Private Hardened Admin Portal</h4>
                  <p className="text-[11px] text-slate-400">Restricted owner console for team role management and audit logs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Guarantee */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>TLS / 256-bit Encrypted Session</span>
            </span>
            <span>TaskFlow Engine v2.5</span>
          </div>

        </div>

        {/* Right Authentication Area (7 cols) */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-[#14151a]">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1c1e24] border border-slate-800 mb-8 max-w-md mx-auto w-full">
            <button
              onClick={() => {
                setActiveMode('credentials');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'credentials'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Direct Sign In</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('sandbox');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMode === 'sandbox'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>1-Click Demo Sandbox</span>
            </button>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div className="mb-6 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Direct Credentials Form */}
          {activeMode === 'credentials' && (
            <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
              
              <div>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  Sign in to your workspace
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered team email or owner administrator credentials.
                </p>
              </div>

              <form onSubmit={handleDirectLogin} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah.chen@taskflow.dev or admin@taskflow.dev"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#1c1e24] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Standard demo pwd: <code className="text-pink-400">manager123</code> / <code className="text-pink-400">emp123</code>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#1c1e24] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to TaskFlow</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Owner Notice */}
              <div className="p-3 rounded-2xl bg-[#181920] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Looking for instant preview without typing?</span>
                <button
                  onClick={() => setActiveMode('sandbox')}
                  className="font-bold text-pink-400 hover:text-pink-300 underline"
                >
                  Use 1-Click Fast-Track
                </button>
              </div>

            </div>
          )}

          {/* Mode 2: 1-Click Sandbox Fast-Track */}
          {activeMode === 'sandbox' && (
            <div className="max-w-md mx-auto w-full space-y-6 animate-in fade-in duration-200">
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Live Demo Sandbox Active
                  </span>
                </div>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  Fast-Track Recruiter & Evaluator Access
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click a persona below to enter an interactive sandbox pre-loaded with commits, tasks, and telemetry.
                </p>
              </div>

              {/* Persona Options */}
              <div className="space-y-3.5">
                
                {/* Manager Sandbox Card */}
                <button
                  onClick={() => handleSandboxLaunch('sarah.chen@taskflow.dev', 'manager')}
                  disabled={Boolean(sandboxLoadingRole)}
                  className="w-full p-4 rounded-2xl bg-[#1c1e24] hover:bg-[#23252d] border border-slate-800 hover:border-pink-500/40 transition-all text-left group relative shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"
                        alt="Sarah Chen"
                        className="w-10 h-10 rounded-2xl object-cover ring-2 ring-pink-500/50 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                            Sarah Chen
                          </span>
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            Manager / Lead
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Inspect diff heuristics, override automated scores, and review sprint submissions.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {sandboxLoadingRole === 'manager' ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Employee Sandbox Card */}
                <button
                  onClick={() => handleSandboxLaunch('alex.dev@taskflow.dev', 'employee')}
                  disabled={Boolean(sandboxLoadingRole)}
                  className="w-full p-4 rounded-2xl bg-[#1c1e24] hover:bg-[#23252d] border border-slate-800 hover:border-indigo-500/40 transition-all text-left group relative shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                        alt="Alex Rivera"
                        className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/50 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            Alex Rivera
                          </span>
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Senior Engineer
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Push commits, track acceptance criteria, resolve blockers, and dispute score verdicts.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {sandboxLoadingRole === 'employee' ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </div>
                </button>

              </div>

              {/* Private Admin Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-600/30 text-[11px] text-amber-200/90 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Security Isolation</span>
                </div>
                <p className="leading-relaxed">
                  Administrator credentials are kept strictly private and excluded from public 1-click launchers. To manage user roles or database health, use Direct Sign In with your master admin login.
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
