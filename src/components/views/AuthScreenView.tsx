import { useState, FormEvent } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Target, Zap, Eye, EyeOff, Award, Quote, Users, GraduationCap, ChevronRight } from 'lucide-react';
import { Stream, Language } from '../../types';
import PasswordStrength from '../../components/PasswordStrength';
import { setAccessToken } from '../../lib/authToken';

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
  { text: "Over 82% of top-scoring Ethiopian students practice at least 3 simulated mock exams weekly.", author: "Matric Board Analytics 2025" },
  { text: "Consistency always triumphs over late-night cramming. Start your 4-week roadmap early.", author: "MoE Academic Excellence Review" },
  { text: "The Scholastic Aptitude Test (SAT) section requires speed. Time tracking is your secret weapon.", author: "AceMatric Coaching Panel" },
  { text: "Understanding concept summaries before jumping into practice tests increases accuracy by 40%.", author: "Dr. Aster Kassahun, Learning Sciences" }
];

export default function AuthScreenView({ language = 'en', onLanguageChange, onAuthComplete }: AuthScreenViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Workspace Split */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-8 py-8 sm:py-12 items-center relative z-10">
        
        {/* LEFT COMPONENT: Professional Branding & Interactive Coaching Ticker */}
        <div className="lg:col-span-7 space-y-8 text-left pr-0 lg:pr-8 animate-fadeIn">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-teal-400 uppercase tracking-widest">
              <Award className="w-4 h-4" />
              <span>ETHIOPIAN UNIVERSITY ENTRANCE PREPARATION</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Master Your Matric <br />
              With <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">AceMatric</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              AceMatric combines adaptive study roadmap scheduling, smart concept explanation via Gemini AI models, timed full-length past paper simulator tests, and immediate micro-analytics to maximize your university placement chances.
            </p>
          </div>

          {/* Testimonial Quote Generator Board */}
          <div className="bg-[#111827]/40 border border-slate-800/80 rounded-3xl p-6 relative max-w-xl shadow-lg backdrop-blur-md">
            <Quote className="w-10 h-10 text-teal-500/10 absolute top-4 left-4" />
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-black text-teal-400 tracking-widest uppercase block">PRO ACADEMIC TIP</span>
              <p className="text-sm text-slate-200 font-medium leading-relaxed italic">
                "{MATRIC_QUOTES[quoteIndex].text}"
              </p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 font-bold">— {MATRIC_QUOTES[quoteIndex].author}</span>
                <button 
                  type="button" 
                  onClick={handleNextQuote}
                  className="text-xs text-teal-400/90 hover:text-teal-300 font-extrabold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <span>Next Tip</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Platform Stats Panel */}
          <div className="grid grid-cols-3 gap-4 max-w-xl pt-2">
            <div className="space-y-1">
              <span className="block text-2xl font-black text-white">500+</span>
              <span className="block text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Practice Questions</span>
            </div>
            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <span className="block text-2xl font-black text-white">9</span>
              <span className="block text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Exam Subjects</span>
            </div>
            <div className="space-y-1 border-l border-slate-800/80 pl-4">
              <span className="block text-2xl font-black text-white">AI</span>
              <span className="block text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Powered Tutor</span>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Ultra-Modern Glassmorphic Authentication Card */}
        <div className="lg:col-span-5 w-full">
          
          {/* Simulated Inbox Mini Banner Indicator */}
          {simulatedInboxEmail && (
            <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/20 rounded-3xl flex items-start space-x-3 text-left animate-slideDown shadow-lg">
              <span className="text-xl shrink-0">📬</span>
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-black text-teal-400 uppercase tracking-widest">Recovery Code Sent</span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  A 6-digit recovery code has been sent to <b>{simulatedInboxEmail.to}</b>. Check your inbox and enter the code below.
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#111827]/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            
            {/* Branding Top Icon */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-500/20 text-teal-400">
                <GraduationCap className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="font-black text-lg text-white">
                  {isForgot ? 'Recover Account' : isReset ? 'Reset Password' : 'Get Started'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isForgot ? 'Request password recovery code' : isReset ? 'Verify code and set password' : 'Join elite Ethiopian students preparing for university'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-extrabold text-rose-400 text-center mb-4 animate-shake">
                {errorMsg}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-extrabold text-emerald-400 text-center mb-4">
                {successMsg}
              </div>
            )}

            {/* Render 1: FORGOT PASSWORD FORM */}
            {isForgot && (
              <div className="space-y-4">
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-400" />
                      <span>Email or Phone Number</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@acematric.edu.et"
                      className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-6"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Finding Account...</span>
                    ) : (
                      <>
                        <span>Send Recovery Email</span>
                        <ArrowRight className="w-5 h-5" />
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
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    ← Cancel and Go Back
                  </button>
                </form>
              </div>
            )}

            {/* Render 2: RESET PASSWORD FORM */}
            {isReset && (
              <div className="space-y-4">
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>6-Digit Security Code</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="e.g. 521908"
                      maxLength={6}
                      className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 text-center font-mono font-black text-lg tracking-widest text-emerald-400 focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-400" />
                      <span>New Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 pr-11 text-sm text-white focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={newPassword} />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-4"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Updating Password...</span>
                    ) : (
                      <>
                        <span>Save & Update Password</span>
                        <ArrowRight className="w-5 h-5" />
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
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    ← Resend Code Request
                  </button>
                </form>
              </div>
            )}

            {/* Render 3: STANDARD SIGNUP / SIGNIN FORM */}
            {!isForgot && !isReset && (
              <>
                {/* Custom Interactive Tab Selectors */}
                <div className="grid grid-cols-2 bg-[#0B111E] rounded-2xl p-1.5 border border-slate-800/60 mb-6">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isSignUp
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      !isSignUp
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        required={isSignUp}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dawit Kassahun"
                        className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-400" />
                      <span>Email or Phone Number</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@acematric.edu.et"
                      className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-teal-400" />
                        <span>Password</span>
                      </label>
                      
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgot(true);
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="text-[11px] text-teal-400 hover:text-teal-300 font-bold transition-all cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#0B111E] border border-slate-700/80 rounded-2xl px-4 py-3.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {isSignUp && <PasswordStrength password={password} />}
                  </div>

                  {isSignUp && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-extrabold text-slate-300">
                        Academic Study Stream
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Natural Science', 'Social Science'] as Stream[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStream(s)}
                            className={`py-3 px-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                              stream === s
                                ? 'bg-teal-500/15 border-teal-400 text-teal-300 shadow-md'
                                : 'bg-[#0B111E] border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{s === 'Natural Science' ? '🧬' : '⚖️'}</span>
                            <span>{s === 'Natural Science' ? 'Natural Sci.' : 'Social Sci.'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-6 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Verifying credentials...</span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Account & Start Roadmap' : 'Sign In to Portal'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-3">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    By entering the portal, you agree to AceMatric academic standards, database guidelines, and security parameters.
                  </p>
                  
                  <div className="pt-1.5">
                    <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                      Contact the administrator for demo access.
                    </p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

      </main>

      {/* Simulated Email Client Modal */}
      {showInbox && simulatedInboxEmail && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#0B111E] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col border-t-[3px] border-t-teal-400">
            
            {/* Header */}
            <div className="bg-[#111827] border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">📬</span>
                <div className="text-left">
                  <h3 className="font-extrabold text-sm text-white">Simulated Student Mail Client</h3>
                  <p className="text-[10px] text-slate-500">Live development sandbox email server</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInbox(false)}
                className="text-xs font-black text-slate-400 hover:text-white px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
              >
                Close Box
              </button>
            </div>

            {/* Metadata */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800 text-xs space-y-1.5 text-left font-mono">
              <div><span className="font-extrabold text-slate-400">Sender:</span> <span className="text-teal-400">security@acematric.edu.et</span></div>
              <div><span className="font-extrabold text-slate-400">Recipient:</span> <span className="text-slate-300">{simulatedInboxEmail.to}</span></div>
              <div><span className="font-extrabold text-slate-400">Subject:</span> <span className="text-white font-bold">{simulatedInboxEmail.subject}</span></div>
            </div>

            {/* Email HTML Viewer */}
            <div className="p-6 bg-[#070A13] flex-1 overflow-y-auto max-h-[350px]">
              <div>{simulatedInboxEmail.html}</div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-[#111827] border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-slate-400 font-bold">Check your inbox for the verification code.</span>
              <button
                type="button"
                onClick={() => {
                  setShowInbox(false);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="w-full border-t border-slate-900/80 py-4 px-6 text-center text-xs text-slate-500 z-10">
        <p>© 2026 AceMatric EdTech. All rights reserved. Precision-built for Ethiopian Scholars.</p>
      </footer>
    </div>
  );
}
