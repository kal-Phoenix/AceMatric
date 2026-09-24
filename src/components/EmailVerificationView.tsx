import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface EmailVerificationViewProps {
  email: string;
  devCode?: string | null;
  onVerified: () => void;
  onBack: () => void;
}

export default function EmailVerificationView({ email, devCode, onVerified, onBack }: EmailVerificationViewProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      focusInput(index + 1);
    }

    if (newCode.every(d => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    const nextEmpty = newCode.findIndex(d => d === '');
    focusInput(nextEmpty === -1 ? 5 : nextEmpty);

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr?: string) => {
    const codeToVerify = codeStr || code.join('');
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      onVerified();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      focusInput(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend');
      }

      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      focusInput(0);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </button>

      <div className="bg-[#1a1f2e] border border-slate-700/50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Verify your email</h2>
        <p className="text-slate-400 text-sm mb-8">
          We sent a 6-digit code to <span className="text-slate-200 font-medium">{email}</span>
        </p>

        {devCode && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
            <p className="text-amber-400 text-xs font-medium mb-1">Dev Mode — Your verification code:</p>
            <p className="text-amber-200 text-2xl font-mono font-bold tracking-widest">{devCode}</p>
          </div>
        )}

        <div className="flex justify-center gap-3 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={() => inputRefs.current[i]?.select()}
              disabled={isLoading}
              className="w-12 h-14 text-center text-xl font-bold bg-[#0f1420] border border-slate-600/50 rounded-xl text-slate-100 focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 outline-none transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={isLoading || code.some(d => d === '')}
          className="w-full bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#090D16] font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-[#2dd4bf] hover:underline font-medium disabled:text-slate-500 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {isResending ? (
                'Sending...'
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                <>
                  <RotateCcw className="w-3 h-3" />
                  Resend code
                </>
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
