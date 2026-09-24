import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, HelpCircle, CheckCircle2, ExternalLink, ChevronDown } from 'lucide-react';
import { ContactMessage } from '../../types';
import { db } from '../../lib/supabase';

interface ContactUsViewProps {
  isAm?: boolean;
  userName?: string;
  userEmail?: string;
}

const FAQS = [
  {
    q: 'How do I upgrade to AceMatric Pro?',
    a: 'Go to the Pro Upgrade page, select a plan, copy the account number, transfer the exact amount (299 ETB/month or 999 ETB/year), and upload your payment screenshot with transaction reference. Admin approves within 15 minutes.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept CBE Birr, Telebirr, and Bank of Abyssinia transfers. After transferring, upload a screenshot and enter your transaction reference number for verification.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'Our AI Tutor uses Google Gemini to explain complex Grade 12 exam questions step by step. Simply type your question in the Study Hub AI Tutor tab and get an instant, detailed explanation with formulas and exam tips.',
  },
  {
    q: 'Can I use AceMatric offline?',
    a: 'Saved study notes work offline. When you reconnect, your progress syncs automatically. Past exam papers, AI Tutor, and Study Room require an internet connection.',
  },
  {
    q: 'How do Study Rooms work?',
    a: 'Study Rooms let you collaborate with other students in real-time. You can chat, share notes, use a Pomodoro timer, take quizzes together, and even enable video. Join an existing room or create your own.',
  },
  {
    q: 'How is my leaderboard rank calculated?',
    a: 'Your score combines XP earned from studying, practice, and mock exams, plus your study streak bonus and exam readiness score. Consistent daily study is the fastest way to climb the ranks.',
  },
];

export default function ContactUsView({ userName = '', userEmail = '' }: ContactUsViewProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);

    const msg: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: name || 'Student',
      email: email || 'anonymous@student.com',
      subject: subject || 'General Support',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    await db.saveContactMessage(msg);
    setIsSent(true);
    setMessage('');
    setSubject('');
    setSending(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 pb-16">

      {/* Header */}
      <div className="bg-[#141920] border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Support</span>
            </div>
            <h1 className="text-xl font-semibold text-white">Contact AceMatric</h1>
            <p className="text-xs text-slate-400">Questions about payments, features, or your account? We are here to help.</p>
          </div>
          <a
            href="https://t.me/acematric_et"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-300 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0"
          >
            Telegram Support
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Contact Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-white">Contact Channels</h3>

            {[
              { icon: Phone, label: 'Phone', value: '+251 911 223344', sub: 'Mon-Sat, 8AM-9PM', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: Mail, label: 'Email', value: 'support@acematric.edu.et', sub: 'Reply within 30 minutes', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { icon: MapPin, label: 'Office', value: 'Bole Road, Mega Building 4F', sub: 'Office 402, Addis Ababa', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            ].map(({ icon: Icon, label, value, sub, color, bg }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className={`p-2 rounded-lg ${bg} ${color} mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
                  <div className="text-xs font-bold text-white mt-0.5">{value}</div>
                  <div className="text-xs text-slate-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick FAQ Teaser */}
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-semibold text-sm text-white">Common Questions</h4>
            <p className="text-xs text-slate-400">Check the FAQ section below for quick answers about payments, features, and study tools.</p>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-3">
          <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5">
            <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              Send a Message
            </h3>

            {isSent ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Message Sent</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Our team will respond shortly. Check your email for updates.</p>
                <button
                  onClick={() => setIsSent(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Payment issue / Bug report / Feature request"
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or issue..."
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#141920] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-sm text-white">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-0 divide-y divide-slate-800/60">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3.5 cursor-pointer" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-200 hover:text-blue-300 transition-colors">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed pr-4">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
