import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, 
  GitBranch, FileText, UserCheck, ShieldAlert, RefreshCw, KeyRound, Eye, EyeOff,
  Building2, Users, Check
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';

// Google Official SVG Icon
function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function LoginPage({ onLoginSuccess }) {
  const [activeMode, setActiveMode] = useState('credentials'); // 'credentials' | 'sandbox'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sandboxLoadingRole, setSandboxLoadingRole] = useState(null);
  const [error, setError] = useState(null);

  // Google Sign-In state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleFullNameInput, setGoogleFullNameInput] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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
      setError(err.message || 'Incorrect email or password.');
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

  const handleGoogleSignIn = async (gmailAddress, fullName = null) => {
    const targetEmail = gmailAddress.trim().toLowerCase();
    
    // Security check: master admin can never login via standard Google button
    if (targetEmail === '106.jedi.master@gmail.com') {
      setError('Google Sign-In failed: Access denied for this identity on public portal.');
      setShowGoogleModal(false);
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const data = await api.loginWithGoogle({
        email: targetEmail,
        full_name: fullName || targetEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetEmail}`,
      });

      setAuthToken(data.access_token);
      setShowGoogleModal(false);
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.message || 'Failed to authenticate via Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Inter'] relative overflow-hidden">
      
      {/* Background Glows */}
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
                Enterprise Core
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
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Team Workspaces & Directory</h4>
                  <p className="text-[11px] text-slate-400">Custom projects, cross-department coordination, and direct peer messaging.</p>
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
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#1c1e24] border border-slate-800 mb-6 max-w-md mx-auto w-full">
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
            <div className="mb-5 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150 max-w-md mx-auto w-full">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Direct Credentials Form */}
          {activeMode === 'credentials' && (
            <div className="max-w-md mx-auto w-full space-y-5 animate-in fade-in duration-200">
              
              <div>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  Sign in to your account
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Access your team tasks, code verification telemetry, and project boards.
                </p>
              </div>

              {/* Google OAuth / Gmail Sign In Button */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#1e2027] hover:bg-[#262933] border border-slate-700/80 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-slate-500"
              >
                <GoogleIcon />
                <span>Continue with Google / Gmail</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-[#14151a] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  Or continue with email
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <form onSubmit={handleDirectLogin} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah.chen@taskflow.dev or alex.dev@taskflow.dev"
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
                      Demo pwd: <code className="text-pink-400">manager123</code> / <code className="text-pink-400">emp123</code>
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
                      <span>Sign In with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Fast-Track Suggestion */}
              <div className="p-3 rounded-2xl bg-[#181920] border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Evaluating the platform?</span>
                <button
                  onClick={() => setActiveMode('sandbox')}
                  className="font-bold text-pink-400 hover:text-pink-300 underline"
                >
                  Launch 1-Click Sandbox
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

            </div>
          )}

        </div>

      </div>

      {/* Interactive Google Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#1a1b22] border border-slate-700 shadow-2xl p-6 sm:p-7 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GoogleIcon />
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Sign in with Google
                </h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an authorized team Gmail address or enter your workspace Google account:
            </p>

            {/* Quick Gmail Selectors */}
            <div className="space-y-2">
              {[
                { email: 'alex.rivera.dev@gmail.com', name: 'Alex Rivera', role: 'Senior Engineer' },
                { email: 'sarah.chen.tech@gmail.com', name: 'Sarah Chen', role: 'Tech Lead' },
                { email: 'priya.patel.ai@gmail.com', name: 'Priya Patel', role: 'AI Researcher' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleSignIn(acc.email, acc.name)}
                  disabled={googleLoading}
                  className="w-full p-2.5 rounded-xl bg-[#22242d] hover:bg-[#2b2e3a] border border-slate-700 text-left text-xs transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.email}`}
                      alt={acc.name}
                      className="w-7 h-7 rounded-full bg-slate-800"
                    />
                    <div>
                      <div className="font-semibold text-white">{acc.name}</div>
                      <div className="text-[10px] text-slate-400">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Or enter any custom Gmail address:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your.name@gmail.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#22242d] border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={() => {
                    if (googleEmailInput.trim()) {
                      handleGoogleSignIn(googleEmailInput.trim());
                    }
                  }}
                  disabled={!googleEmailInput.trim() || googleLoading}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs disabled:opacity-50"
                >
                  {googleLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
