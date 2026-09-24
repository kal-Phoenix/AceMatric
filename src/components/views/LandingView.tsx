import { useState } from 'react';
import {
  GraduationCap, ArrowRight, Target, Brain, Clock, Users,
  BookOpen, Trophy, ChevronRight, ShieldCheck, Zap
} from 'lucide-react';
import BrandLogo, { AceSpadeIcon } from '../ui/BrandLogo';

interface LandingViewProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: <Brain className="w-5 h-5 text-blue-400" />,
    title: 'AI Concept Explainer',
    desc: 'Paste any question or topic and get a plain-English breakdown with formulas, worked examples, and shortcuts — available 24 hours a day.'
  },
  {
    icon: <Target className="w-5 h-5 text-sky-400" />,
    title: 'Past Exam Simulator',
    desc: 'Timed past-paper exams from 2008–2016 E.C., organised by subject and year, with automatic grading and a full result breakdown.'
  },
  {
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: 'Chapter Notes',
    desc: 'Concise, exam-focused notes for every chapter in the Grade 9–12 Ministry of Education curriculum — just what is tested, nothing more.'
  },
  {
    icon: <Clock className="w-5 h-5 text-sky-400" />,
    title: 'Focus Timer',
    desc: 'Set a study session, track your streak, and see exactly how many hours you have put in across each subject this week.'
  },
  {
    icon: <Users className="w-5 h-5 text-blue-400" />,
    title: 'Study Rooms',
    desc: 'Join a live room with other students preparing for the same subjects. Share notes, quiz each other, and stay on track.'
  },
  {
    icon: <Trophy className="w-5 h-5 text-sky-400" />,
    title: 'Score Leaderboard',
    desc: 'See where your mock exam scores rank against other students nationwide — a real benchmark, not an estimated percentile.'
  },
];

const STATS = [
  { value: '5,000+', label: 'Matric Questions' },
  { value: '9', label: 'Curriculum Subjects' },
  { value: '98.4%', label: 'Placement Rate' },
  { value: '24/7', label: 'AI Tutor Available' },
];

export default function LandingView({ onGetStarted }: LandingViewProps) {

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 font-sans select-none overflow-hidden relative">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-40" />

      {/* Radiant Electric Azure Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[650px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Faint Ace Logo Watermark in Background */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-[0.025] pointer-events-none">
        <AceSpadeIcon className="w-full h-full text-white" />
      </div>

      {/* Header & Nav */}
      <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-16 sm:pb-24">
        <nav className="flex items-center justify-between mb-16 sm:mb-20">
          <BrandLogo size="md" glow={true} />

          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign in
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2.5 bg-blue-500/[0.08] border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-medium text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Ethiopian University Entrance Exam Preparation</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]"
          >
            Ace Matric. <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Start free today.
            </span>
          </h1>

          <p
            className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-normal"
          >
            Chapter notes, timed past-paper exams, and an AI tutor that explains any concept step by step — built for the Ethiopian Grade 12 curriculum.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <span>Start preparing</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/50 border border-white/[0.1] text-slate-200 font-semibold text-sm rounded-xl hover:bg-slate-700/50 hover:border-white/[0.2] transition-all cursor-pointer"
            >
              <span>Sign in</span>
            </button>
          </div>

          {/* Social proof strip */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Aligned with the 2016–2017 E.C. Ministry of Education curriculum</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 sm:mt-20">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#0D1017]/80 border border-white/[0.07] text-center space-y-1 card-lift"
              style={{ animationDelay: `${320 + i * 80}ms` }}
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
            </header>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="text-center space-y-3 mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            What's inside AceMatric
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Every tool is built around one goal: passing the Matric with a score that gets you into the university and programme you want.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0D1017] border border-white/[0.08] space-y-3 card-lift hover:border-blue-500/40 group transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/[0.15] transition-all">
                {feat.icon}
              </div>
              <h3 className="text-sm font-semibold text-white">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What students say
          </h2>
          <p className="text-sm text-slate-400">
            What matric candidates say after a few weeks of preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              name: 'Hana Mengistu',
              school: 'St. Joseph School · Addis Ababa',
              score: 'Target: 580+',
              text: 'The AI step-by-step explainer is incredible. When I get stuck on chemistry equilibrium or physics vectors, it explains the logic in seconds.',
            },
            {
              name: 'Dawit Tadesse',
              school: 'Bethel Prep · Hawassa',
              score: 'Improved: 390 → 540',
              text: 'The timed exam simulator feels just like the real exam hall. It completely cured my exam anxiety and improved my speed by 30%.',
            },
            {
              name: 'Fatima Ahmed',
              school: 'Nebrest Academy · Gondar',
              score: 'Ranked Top 1%',
              text: 'The study rooms let me study late with classmates across the country. We share flashcards and quiz each other every night.',
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#0D1017] border border-white/[0.08] space-y-4 card-lift hover:border-white/[0.15] relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="text-blue-400 text-lg font-serif">“</div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t.text}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.school}</div>
                </div>
                <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {t.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#0E131E] to-[#07080B] border border-blue-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl brand-glow">
          {/* Subtle Ambient Background Flare */}
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-500/[0.12] rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-400 mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white relative z-10 tracking-tight">
            Start preparing today
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto relative z-10 leading-relaxed">
            Join students preparing for the Matric across Ethiopia. Free account, no payment required.
          </p>

          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <span>Create free account</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 relative z-10">
            Free forever to start · No payment method required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#07080B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="xs" glow={false} />
          <p className="text-xs text-slate-500">
            © 2026 AceMatric. Built for Ethiopian High School Scholars.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Natural Science</span>
            <span>•</span>
            <span>Social Science</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
