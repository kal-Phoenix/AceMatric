import { useState, useMemo, FormEvent } from 'react';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Stream, Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; stream: Stream; targetScore: number; isNewUser?: boolean; role?: string }) => void;
  language: Language;
  initialMode?: 'signup' | 'login';
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  language,
  initialMode = 'signup'
}: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stream, setStream] = useState<Stream>('Natural Science');
  const [targetScore, setTargetScore] = useState<number>(550);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/5' };
    if (score <= 2) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/5' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500', width: 'w-3/5' };
    if (score <= 4) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-4/5' };
    return { label: 'Very Strong', color: 'bg-emerald-400', width: 'w-full' };
  };

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body = mode === 'signup' 
        ? { email: email.trim(), password: password.trim(), name: name.trim(), stream }
        : { email: email.trim(), password: password.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess({
        name: data.profile.name,
        email: data.profile.email,
        stream: data.profile.stream,
        targetScore: data.profile.targetScore || targetScore,
        isNewUser: mode === 'signup',
        role: data.profile.role
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto min-h-screen">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-5 sm:p-6 text-slate-950 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-white/90 text-xs font-black uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Ethiopian Grade 12 Portal</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            {mode === 'signup'
              ? 'Start your journey to university placement'
              : 'Continue your exam preparation'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-400 text-center">
              {errorMsg}
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kaleb Teshome"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>Password</span>
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-bold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded-full ${strength.color} transition-all`} />
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(password) && password.length >= 8 ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(password) && /[A-Z]/.test(password) ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? strength.color : 'bg-slate-700'} transition-all`} />
                </div>
                <span className="text-[10px] text-slate-500 font-bold">{strength.label}</span>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Study Stream</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Natural Science', 'Social Science'] as Stream[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStream(s)}
                      className={`p-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        stream === s
                          ? 'bg-teal-500/10 border-teal-400 text-teal-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {s === 'Natural Science' ? 'Natural Science' : 'Social Science'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Target Score</span>
                  <span className="text-teal-400 font-black">{targetScore} / 600</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="600"
                  step="10"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-900 cursor-pointer"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            By continuing, you agree to AceMatric's terms and privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
}
