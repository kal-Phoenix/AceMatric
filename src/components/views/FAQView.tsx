import { useState } from 'react';
import { HelpCircle, ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react';

interface FAQPageProps {
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

const FAQ_ITEMS = [
  {
    q: 'What is AceMatric?',
    a: 'AceMatric is an all-in-one educational platform designed for Ethiopian Grade 12 students preparing for the national university entrance examination (Matric). It includes practice question banks, timed mock exam simulators, AI-powered concept explanations, curriculum video lessons, and collaborative study tools.',
  },
  {
    q: 'Is AceMatric free to use?',
    a: 'AceMatric offers a generous free tier with 10 practice questions per day, access to curriculum content, and basic study tools. Premium features like unlimited AI tutoring and full mock exams are available through our Pro Upgrade.',
  },
  {
    q: 'Which subjects are supported?',
    a: 'AceMatric covers Natural Science stream (Physics, Chemistry, Biology, Mathematics) and Social Science stream (Economics, English). Content is mapped to the Ethiopian national curriculum for Grades 9 through 12.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'Our AI Tutor uses Google Gemini AI models to provide detailed, step-by-step explanations for any concept or question. Simply type your question or select a practice question, and the AI will generate a comprehensive explanation tailored to your curriculum.',
  },
  {
    q: 'Can I use AceMatric offline?',
    a: 'Yes! AceMatric has an offline mode that allows you to download study materials and access them without an internet connection. Enable offline mode from your dashboard.',
  },
  {
    q: 'How do mock exams work?',
    a: 'Mock exams simulate the real national entrance exam experience with timed sections, question distributions matching the actual exam, and automatic scoring. You can review detailed analytics after each attempt.',
  },
  {
    q: 'Can I study in Amharic?',
    a: 'Yes, AceMatric supports both English and Amharic interfaces. You can switch languages from the footer or your profile settings. Many practice questions also include Amharic translations.',
  },
  {
    q: 'How do collaborative study rooms work?',
    a: 'Study rooms let you create or join real-time sessions with peers. Features include a shared whiteboard, collaborative notes, group chat, synchronized study timers, and quiz challenges.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Click the "Upgrade" button in the navigation. Pro can be purchased via CBE mobile banking or Telebirr. Pro gives you unlimited AI tutoring, unlimited mock exams, and priority access to new features.',
  },
  {
    q: 'How do I delete my account?',
    a: 'You can delete your account and all associated data from your Profile settings. This action is irreversible. Alternatively, contact us through the Contact Us page.',
  },
];

export default function FAQView({ onBack, onNavigate }: FAQPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 font-bold transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-500/20">
            <HelpCircle className="w-5 h-5 text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Frequently Asked Questions</h1>
        </div>
        <p className="text-sm text-slate-400">Find answers to common questions about AceMatric.</p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="rounded-2xl bg-[#111827]/60 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-slate-900/40 transition-colors"
            >
              <span className="text-sm font-black text-white pr-4">{item.q}</span>
              {openIndex === i ? (
                <ChevronUp className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4">
                <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="p-6 rounded-2xl bg-[#111827]/40 border border-slate-800/80 text-center space-y-3">
        <h3 className="text-sm font-black text-white">Still have questions?</h3>
        <p className="text-xs text-slate-400">Our support team is here to help.</p>
        <button
          onClick={() => onNavigate?.('contact')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>Contact Support</span>
        </button>
      </section>
    </div>
  );
}
