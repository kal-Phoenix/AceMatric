import { useState, FormEvent, useEffect, useRef } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Award, GraduationCap, ChevronRight } from 'lucide-react';
import { Stream, Language } from '../../types';
import PasswordStrength from '../../components/PasswordStrength';
import { setAccessToken } from '../../lib/authToken';
import BrandLogo from '../ui/BrandLogo';
import EmailVerificationView from '../../components/EmailVerificationView';

interface AuthScreenViewProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onAuthComplete: (userData: {
    name: string;
    email: string;
    stream: Stream;
    targetScore: number;
    isNewUser: boolean;
    role?: string;
  }) => void;
}

const MATRIC_QUOTES = [
  { text: "Over 82% of top-scoring Ethiopian students practice at least 3 mock exams weekly.", author: "Matric Board Analytics 2025" },
  { text: "Consistency always triumphs over late-night cramming. Start your 4-week plan early.", author: "MoE Academic Excellence Review" },
  { text: "Understanding summaries before practice tests increases accuracy by 40%.", author: "AceMatric Coaching Panel" }
];

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_auth_config: 'Google sign-in is not configured on this server yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_no_email: 'Google did not share an email address. Pick an address with an email permission and try again.',
  google_signup_failed: 'Could not create your account. Please try again.',
  google_profile_failed: 'Could not finish setting up your account. Please try again.',
  google_session_failed: 'Could not start your session. Please try again.',
  google_auth_failed: 'Google sign-in failed. Please try again.',
};

export default function AuthScreenView({ language = 'en', onLanguageChange, onAuthComplete }: AuthScreenViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [pendingDevCode, setPendingDevCode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stream, setStream] = useState<Stream>('Natural Science');
  const [targetScore, setTargetScore] = useState(520);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [simulatedInboxEmail, setSimulatedInboxEmail] = useState<{
    subject: string;
    html: string;
    to: string;
    code: string;
  } | null>(null);
  const [showInbox, setShowInbox] = useState(false);

  const isAm = language === 'am';

  const [oauth, setOauth] = useState<{ googleEnabled: boolean } | null>(null);

  // Surface OAuth failures that arrive as /?error=... and strip the query so a
  // refresh doesn't re-show the message.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    if (code) {
      setErrorMsg(OAUTH_ERROR_MESSAGES[code] || 'Sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Which social providers are actually configured on this server?
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/oauth/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cancelled) return;
        setOauth({
          googleEnabled: Boolean(cfg?.google?.enabled),
        });
      })
      .catch(() => {
        if (!cancelled) setOauth({ googleEnabled: false });
      });
    return () => { cancelled = true; };
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MATRIC_QUOTES.length);
  };



  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recovery request failed.');
      }

      setSuccessMsg(`If an account exists with ${email.trim()}, a recovery code has been sent to your email. Check your inbox and enter the code below.`);
      setIsReset(true);
      setIsForgot(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !recoveryCode.trim() || !newPassword.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: recoveryCode.trim(),
          newPassword: newPassword.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset failed.');
      }

      setSuccessMsg('Your password has been reset successfully! Try signing in with your new credentials.');
      setIsReset(false);
      setIsForgot(false);
      setIsSignUp(false);
      setPassword(newPassword.trim()); // prefill the sign-in password
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed. Verify code validity.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter email and password');
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
      const body = isSignUp 
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

      if (data.token) {
        setAccessToken(data.token);
      }

      // If email not verified, show verification screen
      if (data.emailVerified === false) {
        setPendingEmail(data.profile.email);
        setPendingProfile(data.profile);
        setPendingDevCode(data.devCode || null);
        setPendingVerification(true);
        return;
      }

      onAuthComplete({
        name: data.profile.name,
        email: data.profile.email,
        stream: data.profile.stream,
        targetScore: data.profile.targetScore || targetScore,
        isNewUser: isSignUp,
        role: data.profile.role
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection to database failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    if (pendingProfile) {
      onAuthComplete({
        name: pendingProfile.name,
        email: pendingProfile.email,
        stream: pendingProfile.stream,
        targetScore: pendingProfile.targetScore || targetScore,
        isNewUser: isSignUp,
        role: pendingProfile.role,
      });
    }
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center items-center font-sans">
        <div className="w-full max-w-md px-4">
          <div className="flex justify-center mb-8">
            <BrandLogo />
          </div>
          <EmailVerificationView
            email={pendingEmail}
            devCode={pendingDevCode}
            onVerified={handleVerificationComplete}
            onBack={() => {
              setPendingVerification(false);
              setPendingEmail('');
              setPendingProfile(null);
              setPendingDevCode(null);
              setAccessToken(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Main Content Workspace Split */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-8 py-8 sm:py-12 items-center relative z-10">
        
        {/* LEFT COMPONENT: Professional Branding & Interactive Coaching Ticker */}
        <div className="lg:col-span-7 space-y-8 text-left pr-0 lg:pr-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo size="lg" glow={true} />
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
                <Award className="w-3.5 h-3.5 text-blue-500" />
                <span>Ethiopian University Entrance Prep</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Ace Matric.
              <br />
              <span className="text-slate-400 font-semibold">Free to start.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
              Past-paper exams, chapter notes, and an AI tutor for every Grade 9–12 subject in the Ethiopian national curriculum.
            </p>
          </div>

          {/* Study Tips */}
          <div className="bg-slate-800/50 border border-slate-800/60 rounded-xl p-6 relative max-w-xl">
            <div className="space-y-3">
              <span className="text-xs font-medium text-slate-400 tracking-wider uppercase block">Study tip</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {MATRIC_QUOTES[quoteIndex].text}
              </p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">— {MATRIC_QUOTES[quoteIndex].author}</span>
                <button 
                  type="button" 
                  onClick={handleNextQuote}
                  className="text-xs text-slate-400 hover:text-white font-medium flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-xl pt-2">
            <div className="space-y-1">
              <span className="block text-2xl font-bold text-white">5,000+</span>
              <span className="block text-xs uppercase font-medium text-slate-500 tracking-wider">Questions</span>
            </div>
            <div className="space-y-1 border-l border-slate-800/60 pl-4">
              <span className="block text-2xl font-bold text-white">9</span>
              <span className="block text-xs uppercase font-medium text-slate-500 tracking-wider">Subjects</span>
            </div>
            <div className="space-y-1 border-l border-slate-800/60 pl-4">
              <span className="block text-2xl font-bold text-white">24/7</span>
              <span className="block text-xs uppercase font-medium text-slate-500 tracking-wider">AI Tutor</span>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Ultra-Modern Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
          
          {/* Simulated Inbox Mini Banner Indicator */}
          {simulatedInboxEmail && (
            <div className="mb-4 p-4 bg-slate-800/50 border border-white/10 rounded-xl flex items-start space-x-3 text-left">
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-medium text-slate-300 uppercase tracking-wider">Recovery code sent</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  A 6-digit code has been sent to <b className="text-slate-300">{simulatedInboxEmail.to}</b>. Check your inbox.
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            
            <div className="flex items-center space-x-3 mb-6">
              <BrandLogo size="md" showText={false} glow={true} />
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">
                  {isForgot ? 'Recover account' : isReset ? 'Reset password' : isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isForgot ? 'We will send a 6-digit recovery code' : isReset ? 'Set your new password below' : isSignUp ? 'Free access to notes, AI tutor, and practice exams' : 'Enter your credentials to continue studying'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-medium text-rose-400 text-center mb-4 animate-shake">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-400 text-center mb-4">
                {successMsg}
              </div>
            )}            {/* Render 1: FORGOT PASSWORD FORM */}
            {isForgot && (
              <div className="space-y-4">
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">
                      Email address
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-5 shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Finding account...</span>
                    ) : (
                      <>
                        <span>Send recovery email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(false);
                      setIsReset(false);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-700/60 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ← Back to login
                  </button>
                </form>
              </div>
            )}

            {/* Render 2: RESET PASSWORD FORM */}
            {isReset && (
              <div className="space-y-4">
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">
                      6-digit recovery code
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 521908"
                      maxLength={6}
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-center font-mono font-bold text-xl tracking-widest text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
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
                    <PasswordStrength password={newPassword} />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-5 shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Updating Password...</span>
                    ) : (
                      <>
                        <span>Save & Update Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(true);
                      setIsReset(false);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-700/60 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ← Resend code
                  </button>
                </form>
              </div>
            )}

            {/* Render 3: STANDARD SIGNUP / SIGNIN FORM */}
            {!isForgot && !isReset && (
              <>
                <div className="grid grid-cols-2 bg-slate-800/60 rounded-xl p-1 border border-slate-700/60 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSignUp
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isSignUp
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign in
                  </button>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (oauth && !oauth.googleEnabled) {
                        setErrorMsg(OAUTH_ERROR_MESSAGES.google_auth_config);
                        return;
                      }
                      window.location.href = '/api/auth/google';
                    }}
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



                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/60"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 text-slate-500 bg-[#111827]">or use email</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {isSignUp && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-300">
                        Full name
                      </label>
                      <input
                        type="text"
                        required={isSignUp}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dawit Kassahun"
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgot(true);
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-all cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
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
                    {isSignUp && <PasswordStrength password={password} />}
                  </div>

                  {isSignUp && (
                    <div className="space-y-1.5 pt-1 text-left">
                      <label className="text-xs font-semibold text-slate-300">
                        Study stream
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Natural Science', 'Social Science'] as Stream[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStream(s)}
                            className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
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
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-6 active:scale-[0.98] shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Please wait...</span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create free account' : 'Sign in to dashboard'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-800/60 text-center space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    By continuing, you agree to AceMatric's terms and privacy policy.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>

      </main>

      {/* Simulated Email Client Modal */}
      {showInbox && simulatedInboxEmail && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B111E] border border-slate-800/60 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            
            <div className="bg-slate-800/40 border-b border-slate-800/60 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="text-left">
                  <h3 className="font-medium text-sm text-white">Recovery email</h3>
                  <p className="text-xs text-slate-500">Check your inbox for the code</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInbox(false)}
                className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Metadata */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800/60 text-xs space-y-1.5 text-left font-mono">
              <div><span className="font-medium text-slate-400">From:</span> <span className="text-white">security@acematric.com</span></div>
              <div><span className="font-medium text-slate-400">To:</span> <span className="text-slate-300">{simulatedInboxEmail.to}</span></div>
              <div><span className="font-medium text-slate-400">Subject:</span> <span className="text-white">{simulatedInboxEmail.subject}</span></div>
            </div>

            {/* Email HTML Viewer */}
            <div className="p-6 bg-[#070A13] flex-1 overflow-y-auto max-h-[350px]">
              <div>{simulatedInboxEmail.html}</div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-[#111827] border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-slate-400">Check your inbox for the recovery code.</span>
              <button
                type="button"
                onClick={() => {
                  setShowInbox(false);
                }}
                className="w-full sm:w-auto bg-slate-800/50 hover:bg-white/15 text-white font-medium px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="w-full border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 z-10">
        <p>© 2026 AceMatric. All rights reserved.</p>
      </footer>
    </div>
  );
}
