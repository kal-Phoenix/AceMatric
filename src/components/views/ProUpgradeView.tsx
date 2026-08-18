import { useState, useEffect, useRef } from 'react';
import { Zap, Upload, CheckCircle2, Clock, XCircle, Building2, Smartphone, CreditCard, ArrowRight, Image, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { db } from '../../lib/supabase';
import { PaymentRequest, PaymentMethod } from '../../types';

const METHOD_ICONS: Record<PaymentMethod, typeof Building2> = {
  cbe: Building2,
  telebirr: Smartphone,
  abyssinia: CreditCard,
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  cbe: 'from-blue-500 to-blue-600',
  telebirr: 'from-green-500 to-emerald-600',
  abyssinia: 'from-orange-500 to-red-500',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cbe: 'CBE Birr',
  telebirr: 'Telebirr',
  abyssinia: 'Bank of Abyssinia',
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Under Review' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', label: 'Rejected' },
};

interface AccountInfo {
  bank: string;
  accountName: string;
  accountNumber: string;
  note: string;
}

export default function ProUpgradeView({ isPremium }: { isPremium: boolean }) {
  const [accounts, setAccounts] = useState<Record<string, AccountInfo>>({});
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.getPaymentAccounts().then(setAccounts).catch(() => {});
    db.getMyPayments().then(setPayments).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitMsg({ type: 'error', text: 'Screenshot must be under 5MB.' });
      return;
    }
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setSubmitMsg(null);
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !screenshot || !transactionRef.trim()) return;
    setIsSubmitting(true);
    setSubmitMsg(null);
    try {
      await db.submitPayment(selectedMethod, transactionRef.trim(), screenshot);
      setSubmitMsg({ type: 'success', text: 'Payment submitted! The admin will review your submission shortly.' });
      setSelectedMethod(null);
      setTransactionRef('');
      setScreenshot(null);
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      const updated = await db.getMyPayments();
      setPayments(updated);
    } catch (err: any) {
      setSubmitMsg({ type: 'error', text: err.message || 'Submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isPremium) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white">You're a Pro Member!</h2>
          <p className="text-sm text-slate-400">You have unlimited access to all premium features including AI tutoring, mock exams, and more.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 rounded-full text-xs font-extrabold text-teal-400 uppercase tracking-widest">
          <Zap className="w-4 h-4" />
          <span>Pro Upgrade</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Unlock Unlimited Access</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Get unlimited AI tutoring, unlimited mock exams, and priority access to all features for just <span className="text-teal-400 font-black">199 ETB/month</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Unlimited AI Tutor', desc: 'Ask anything, get instant explanations' },
          { label: 'Unlimited Mock Exams', desc: 'Practice without daily limits' },
          { label: 'Priority Support', desc: 'Get help faster from our team' },
        ].map((b, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#111827]/60 border border-slate-800/80 text-center space-y-1">
            <CheckCircle2 className="w-5 h-5 text-teal-400 mx-auto" />
            <div className="text-xs font-black text-white">{b.label}</div>
            <div className="text-[10px] text-slate-500">{b.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">1. Choose Payment Method</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((method) => {
            const Icon = METHOD_ICONS[method];
            const isSelected = selectedMethod === method;
            return (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/10 border-teal-500/40 ring-1 ring-teal-500/30'
                    : 'bg-[#111827]/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${METHOD_COLORS[method]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{METHOD_LABELS[method]}</div>
                    <div className="text-[10px] text-slate-500">199 ETB / month</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMethod && accounts[selectedMethod] && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-black text-white">2. Transfer Payment</h2>
          <div className="p-5 rounded-2xl bg-[#111827]/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${METHOD_COLORS[selectedMethod]} flex items-center justify-center`}>
                {(() => { const I = METHOD_ICONS[selectedMethod]; return <I className="w-5 h-5 text-white" />; })()}
              </div>
              <div>
                <div className="text-sm font-black text-white">{accounts[selectedMethod].bank}</div>
                <div className="text-[10px] text-slate-500">Transfer exactly 199 ETB</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Account Name</div>
                  <div className="text-xs font-bold text-white">{accounts[selectedMethod].accountName}</div>
                </div>
                <button onClick={() => copyToClipboard(accounts[selectedMethod].accountName, 'name')} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                  {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Account Number</div>
                  <div className="text-sm font-black text-teal-400 font-mono tracking-wider">{accounts[selectedMethod].accountNumber}</div>
                </div>
                <button onClick={() => copyToClipboard(accounts[selectedMethod].accountNumber, 'number')} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                  {copiedField === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 italic px-1">{accounts[selectedMethod].note}</p>
            </div>
          </div>
        </div>
      )}

      {selectedMethod && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-black text-white">3. Submit Payment Proof</h2>

          {submitMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-extrabold text-center border ${
              submitMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {submitMsg.text}
            </div>
          )}

          <div className="space-y-4 p-5 rounded-2xl bg-[#111827]/60 border border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Phone number, reference code, or note from transfer"
                maxLength={200}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 transition-colors"
              />
              <p className="text-[10px] text-slate-500">Enter the reference code or phone number from your transfer</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300">
                Payment Screenshot
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  screenshotPreview
                    ? 'border-teal-500/40 bg-teal-500/5'
                    : 'border-slate-700/60 hover:border-slate-600 bg-slate-900/30'
                }`}
              >
                {screenshotPreview ? (
                  <div className="space-y-2">
                    <img src={screenshotPreview} alt="Payment screenshot" className="max-h-48 mx-auto rounded-xl object-contain" />
                    <p className="text-[10px] text-slate-500">Click to change screenshot</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Click to upload screenshot</p>
                    <p className="text-[10px] text-slate-500">JPEG, PNG, or WebP. Max 5MB.</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!screenshot || !transactionRef.trim() || isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Submitting...</span>
              ) : (
                <>
                  <span>Submit for Review</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400/80 leading-relaxed">
                After submitting, an admin will verify your payment. This usually takes within 24 hours. You'll receive a notification once your payment is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-black text-white cursor-pointer hover:text-teal-400 transition-colors"
          >
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Payment History ({payments.length})</span>
          </button>

          {showHistory && (
            <div className="space-y-2">
              {payments.map((p) => {
                const cfg = STATUS_CONFIG[p.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={p.id} className={`p-4 rounded-2xl border ${cfg.bg} flex items-center justify-between`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-500">{METHOD_LABELS[p.paymentMethod]}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Ref: {p.transactionRef} • {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                      {p.adminNotes && (
                        <div className="text-[10px] text-slate-400 italic">Admin: {p.adminNotes}</div>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-300">{p.amount} ETB</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
