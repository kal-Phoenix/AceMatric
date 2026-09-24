import { useState, useMemo, FormEvent, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Stream, Language } from '../types';
import { setAccessToken } from '../lib/authToken';

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
    return { label: 'Very strong', color: 'bg-emerald-400', width: 'w-full' };
  };

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // Load Apple JS SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleAppleSignIn = async () => {
    try {
      // @ts-ignore — Apple JS SDK loaded dynamically
      if (window.AppleID) {
        // @ts-ignore
        const response = await window.AppleID.auth.signIn();
        if (response?.authorization?.id_token) {
          setIsLoading(true);
          const fullName = response.user?.name
            ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim()
            : undefined;
          const res = await fetch('/api/auth/apple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.authorization.id_token, fullName }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Apple sign-in failed');
          if (data.token) setAccessToken(data.token);
          onLoginSuccess({
            name: data.profile.name,
            email: data.profile.email,
            stream: data.profile.stream,
            targetScore: data.profile.targetScore || 550,
            isNewUser: data.isNewUser,
            role: data.profile.role,
          });
          onClose();
        }
      } else {
        setErrorMsg('Apple Sign-In is loading. Please try again.');
      }
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        setErrorMsg(err.message || 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        throw new Error(data.error || 'Something went wrong');
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
      setErrorMsg(err.message || 'Connection failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto min-h-screen">
      <div className="relative w-full max-w-md bg-[#0F141F] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">

        {/* Header */}
        <div className="p-6 border-b border-slate-800/60 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Ethiopian Grade 12 Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {mode === 'signup'
              ? 'Start preparing for the Matric exam with AI tutoring & mock tests'
              : 'Sign in to access your notes, exams, and analytics'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60 mb-2">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); }}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log in
            </button>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-2">
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/google'; }}
              className="w-full py-3 bg-slate-800/50 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-3 cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleAppleSignIn}
              className="w-full py-3 bg-slate-800/50 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-3 cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/60"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-slate-500 bg-[#0F141F]">or use email</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400 text-center">
              {errorMsg}
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dawit Kassahun"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                >
                  Need an account?
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
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1.5">
                  <div className={`h-1.5 flex-1 rounded-full ${strength.color} transition-all`} />
                  <div className={`h-1.5 flex-1 rounded-full ${password.length >= 8 ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1.5 flex-1 rounded-full ${/[A-Z]/.test(password) && password.length >= 8 ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1.5 flex-1 rounded-full ${/[0-9]/.test(password) && /[A-Z]/.test(password) ? strength.color : 'bg-slate-700'} transition-all`} />
                  <div className={`h-1.5 flex-1 rounded-full ${/[^A-Za-z0-9]/.test(password) ? strength.color : 'bg-slate-700'} transition-all`} />
                </div>
                <span className="text-xs text-slate-400 font-medium">{strength.label}</span>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Study stream</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Natural Science', 'Social Science'] as Stream[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStream(s)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        stream === s
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-bold'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span>Target score</span>
                  <span className="text-blue-400 font-bold">{targetScore} / 600</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="600"
                  step="10"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-700 cursor-pointer h-2 rounded-lg"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-5 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Please wait...</span>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create free account' : 'Sign in to dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center leading-relaxed pt-2">
            By continuing, you agree to AceMatric's terms and privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
}
