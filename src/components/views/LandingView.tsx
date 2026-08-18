import { GraduationCap, ArrowRight, Target, Brain, Clock, Users, BookOpen, Trophy, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
}

const FEATURES = [
  { icon: <Brain className="w-5 h-5 text-teal-400" />, title: 'AI-Powered Tutoring', desc: 'Get instant, detailed explanations for any concept using advanced AI.' },
  { icon: <Target className="w-5 h-5 text-emerald-400" />, title: 'Mock Exam Simulators', desc: 'Timed exams replicating the real national entrance test experience.' },
  { icon: <BookOpen className="w-5 h-5 text-cyan-400" />, title: 'Curriculum Content', desc: 'Video lessons, formula sheets, and study notes for Grades 9–12.' },
  { icon: <Clock className="w-5 h-5 text-indigo-400" />, title: 'Smart Study Timer', desc: 'Track focused study sessions and build consistent daily habits.' },
  { icon: <Users className="w-5 h-5 text-purple-400" />, title: 'Collaborative Rooms', desc: 'Study with peers in real-time with shared whiteboards and chat.' },
  { icon: <Trophy className="w-5 h-5 text-amber-400" />, title: 'National Leaderboard', desc: 'Compete with students across Ethiopia and track your ranking.' },
];

const STATS = [
  { value: '500+', label: 'Questions' },
  { value: '9', label: 'Subjects' },
  { value: '4', label: 'Grade Levels' },
  { value: '24/7', label: 'Available' },
];

export default function LandingView({ onGetStarted }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans select-none overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20 sm:pt-12 sm:pb-28">
        <nav className="flex items-center justify-between mb-16 sm:mb-24">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-teal-500/20">
              A
            </div>
            <span className="font-black text-lg tracking-wide text-white">
              ACE<span className="text-teal-400">MATRIC</span>
            </span>
          </div>
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </nav>

        <div className="text-center max-w-3xl mx-auto space-y-6 animate-fadeIn">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 rounded-full text-xs font-extrabold text-teal-400 uppercase tracking-widest">
            <GraduationCap className="w-4 h-4" />
            <span>Ethiopian University Entrance Preparation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05]">
            Master Your Matric <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">With AceMatric</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            The all-in-one platform combining adaptive study roadmaps, AI concept explanations, timed mock exams, and collaborative study rooms to maximize your university placement chances.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-teal-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Start Preparing Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-sm rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16 sm:mt-20">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Everything You Need to Ace It</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">Built specifically for the Ethiopian national entrance exam with tools that actually work.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#111827]/60 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-sm font-black text-white">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-teal-950/40 to-emerald-950/30 border border-teal-500/20 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Ready to Score 620+?</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Join thousands of Ethiopian students already using AceMatric to prepare for their university entrance exams.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-teal-500/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Create Free Account</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-[10px] text-slate-500">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 py-6 px-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 AceMatric EdTech. All rights reserved.</p>
      </footer>
    </div>
  );
}
