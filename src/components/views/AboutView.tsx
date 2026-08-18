import { ArrowLeft, GraduationCap, Users, Target, Sparkles, BookOpen, Globe } from 'lucide-react';

interface AboutPageProps {
  onBack?: () => void;
}

export default function AboutView({ onBack }: AboutPageProps) {
  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 space-y-10">
      <div className="space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 font-bold transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-teal-400 uppercase tracking-widest">
            <GraduationCap className="w-4 h-4" />
            <span>Our Mission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Empowering Ethiopian Students to <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Ace Their Matric</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
            AceMatric was built with one goal: give every Ethiopian Grade 12 student the tools, confidence, and preparation they need to excel in their national university entrance examination.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: <BookOpen className="w-5 h-5 text-teal-400" />, title: 'Curriculum-Aligned Content', desc: 'Practice questions, study notes, and video lessons mapped directly to the Ethiopian national curriculum for Grades 9–12.' },
          { icon: <Sparkles className="w-5 h-5 text-emerald-400" />, title: 'AI-Powered Tutoring', desc: 'Get instant, detailed explanations for any concept using advanced AI models trained on the national syllabus.' },
          { icon: <Target className="w-5 h-5 text-cyan-400" />, title: 'Realistic Exam Simulation', desc: 'Timed mock exams that replicate the actual national entrance test experience, complete with scoring and analytics.' },
          { icon: <Users className="w-5 h-5 text-indigo-400" />, title: 'Collaborative Study', desc: 'Join real-time study rooms with peers, share notes, use a collaborative whiteboard, and challenge each other with quizzes.' },
        ].map((item, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#111827]/60 border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              {item.icon}
            </div>
            <h3 className="text-sm font-black text-white">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-white">Built for Ethiopia</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          AceMatric is designed specifically for the Ethiopian education system. Our content covers Natural Science and Social Science streams, supporting subjects including Physics, Chemistry, Biology, Mathematics, English, and Economics. We support both English and Amharic interfaces to ensure every student can learn in their preferred language.
        </p>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Globe className="w-4 h-4 text-teal-400" />
            <span>English & Amharic</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Grades 9–12</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>6 Subjects</span>
          </div>
        </div>
      </section>

      <section className="p-6 rounded-2xl bg-gradient-to-br from-teal-950/30 to-emerald-950/20 border border-teal-500/20 text-center space-y-3">
        <h3 className="text-lg font-black text-white">Ready to Start?</h3>
        <p className="text-xs text-slate-400">Join thousands of Ethiopian students already using AceMatric to prepare for their university entrance exams.</p>
      </section>
    </div>
  );
}
