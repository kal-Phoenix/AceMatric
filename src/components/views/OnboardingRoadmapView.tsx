import { useState, useEffect } from 'react';
import { Target, BookOpen, Sparkles, ArrowRight, School, ArrowLeft, Award, Flame, RefreshCw } from 'lucide-react';
import { Stream, Language, Subject, UserProfile } from '../../types';
import { db } from '../../lib/supabase';

interface OnboardingRoadmapViewProps {
  stream: Stream;
  language: Language;
  userName: string;
  userProfile?: UserProfile | null;
  onComplete: (onboardingData: {
    dailyHours: number;
    studyStyle: string;
    targetScore: number;
    weakSubjects: Subject[];
    customRoadmap: string;
    school: string;
    region: string;
    bio: string;
  }) => void;
}

const NATURAL_SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'SAT'];
const SOCIAL_SUBJECTS: Subject[] = ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'SAT'];
const REGIONS = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'South Ethiopia', 'Central Ethiopia', 'Dire Dawa', 'Harari'];

export default function OnboardingRoadmapView({
  stream,
  language,
  userName,
  userProfile,
  onComplete
}: OnboardingRoadmapViewProps) {
  const [step, setStep] = useState<number>(1);
  const [school, setSchool] = useState(userProfile?.school || '');
  const [region, setRegion] = useState(userProfile?.region || 'Addis Ababa');
  const [dailyHours, setDailyHours] = useState<number>(userProfile?.dailyHours || 3);
  const [targetScore, setTargetScore] = useState<number>(userProfile?.targetScore || 520);
  const [weakSubjects, setWeakSubjects] = useState<Subject[]>(userProfile?.weakSubjects || ['Physics', 'Mathematics']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<string>('');
  const [existingRoadmapLoaded, setExistingRoadmapLoaded] = useState(false);

  // If the user already has a saved roadmap, skip straight to displaying it
  useEffect(() => {
    if (userProfile?.customRoadmap && !existingRoadmapLoaded) {
      setGeneratedRoadmap(userProfile.customRoadmap);
      setExistingRoadmapLoaded(true);
      setStep(4);
    }
  }, [userProfile?.customRoadmap, existingRoadmapLoaded]);

  const subjectsList = stream === 'Natural Science' ? NATURAL_SUBJECTS : SOCIAL_SUBJECTS;

  const handleToggleSubject = (s: Subject) => {
    if (weakSubjects.includes(s)) {
      if (weakSubjects.length > 1) {
        setWeakSubjects(weakSubjects.filter(item => item !== s));
      }
    } else {
      setWeakSubjects([...weakSubjects, s]);
    }
  };

  const generateAIRoadmap = async () => {
    setStep(4);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetScore,
          currentHours: dailyHours,
          weakSubjects,
          stream,
          language,
          school,
          region,
        })
      });
      const data = await res.json();
      if (data.plan) {
        // Backend auto-persists the roadmap to the user's profile
        setGeneratedRoadmap(data.plan);
      } else {
        throw new Error('No roadmap returned');
      }
    } catch {
      // Network error — generate client-side fallback and persist it
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const w1 = new Date(startDate);
      const w2 = new Date(w1); w2.setDate(w2.getDate() + 7);
      const w3 = new Date(w2); w3.setDate(w3.getDate() + 7);
      const w4 = new Date(w3); w4.setDate(w4.getDate() + 7);

      const fallback = `## 4-Week Study Roadmap for ${userName}
**Stream**: ${stream} | **Target**: ${targetScore}/600 | **Focus**: ${weakSubjects.join(', ')}

### Week 1: Foundation (${fmt(w1)} - ${fmt(new Date(w1.getTime() + 6*86400000))})
- Review core concepts in ${weakSubjects[0]} and ${weakSubjects[1] || 'your weakest subject'}
- Complete 2 practice sets per day
- Read summary notes before attempting questions

### Week 2: Deep Dive (${fmt(w2)} - ${fmt(new Date(w2.getTime() + 6*86400000))})
- Focus on ${subjectsList.slice(0, 3).join(', ')}
- Take one timed mock exam
- Review all incorrect answers and explanations

### Week 3: Speed & Accuracy (${fmt(w3)} - ${fmt(new Date(w3.getTime() + 6*86400000))})
- Full-length past paper simulations
- Target: complete each section within time limits
- Identify and fill remaining knowledge gaps

### Week 4: Final Review (${fmt(w4)} - ${fmt(new Date(w4.getTime() + 6*86400000))})
- Light review of formulas and key concepts
- Take 1-2 practice exams under exam conditions
- Rest well before the actual exam`;
      setGeneratedRoadmap(fallback);
      // Persist fallback since backend was unreachable
      db.saveStudentProfile({
        ...userProfile,
        email: userProfile?.email || '',
        name: userProfile?.name || userName,
        stream,
        customRoadmap: fallback,
        school,
        region,
        dailyHours,
        targetScore,
        weakSubjects,
      } as any).catch(() => {});
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setGeneratedRoadmap('');
    try {
      const res = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetScore,
          currentHours: dailyHours,
          weakSubjects,
          stream,
          language,
          school,
          region,
        })
      });
      const data = await res.json();
      if (data.plan) {
        // Backend auto-persists the roadmap to the user's profile
        setGeneratedRoadmap(data.plan);
      }
    } catch {
      // keep existing roadmap on failure
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#111827]/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
        
        {/* Progress Header */}
        <div className="bg-[#1F2937]/50 border-b border-slate-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <div>
              <span className="font-black text-xs text-teal-400 uppercase tracking-widest block">SETUP</span>
              <span className="font-extrabold text-sm text-white">
                {step <= 3 ? `Step ${step} of 3` : 'Your Study Roadmap'}
              </span>
            </div>
          </div>
          <div className="flex space-x-1.5 items-center">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-teal-400' : (i < step ? 'w-3 bg-emerald-500' : 'w-3 bg-slate-800')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between min-h-[500px]">
          
          {/* STEP 1: Academic Profile */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Academic Profile</h3>
                <p className="text-sm text-slate-400">Help us personalize your study plan</p>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">School Name</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Lideta Catholic Cathedral"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-hidden focus:border-teal-400 transition-colors cursor-pointer"
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Daily Study Hours</span>
                    <span className="text-teal-400 font-black">{dailyHours} hrs/day</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full accent-teal-400 bg-slate-900 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Target Score</span>
                    <span className="text-teal-400 font-black">{targetScore} / 600</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="600"
                    step="10"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full accent-teal-400 bg-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Weak Subjects */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Focus Subjects</h3>
                <p className="text-sm text-slate-400">Select the subjects you need the most help with</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {subjectsList.map((s) => {
                  const selected = weakSubjects.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleSubject(s)}
                      className={`p-4 rounded-2xl border text-sm font-black transition-all cursor-pointer ${
                        selected
                          ? 'bg-teal-500/15 border-teal-400 text-teal-300 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Confirm & Generate */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Ready to Start</h3>
                <p className="text-sm text-slate-400">Review your profile and generate your roadmap</p>
              </div>

              <div className="max-w-sm mx-auto space-y-3">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">School</span>
                    <span className="text-white font-bold">{school || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Region</span>
                    <span className="text-white font-bold">{region}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Daily Hours</span>
                    <span className="text-white font-bold">{dailyHours} hrs</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Score</span>
                    <span className="text-white font-bold">{targetScore}/600</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Focus Subjects</span>
                    <span className="text-teal-400 font-bold">{weakSubjects.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Generated Roadmap */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-400 text-slate-950 mx-auto flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-white">Your Study Roadmap</h3>
                <p className="text-sm text-slate-400">Personalized based on your profile</p>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center py-12 space-y-4">
                  <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400 font-bold">Generating your roadmap...</span>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 max-h-[300px] overflow-y-auto">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {generatedRoadmap.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-black text-white mt-4 mb-2">{line.replace('## ', '')}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-black text-teal-400 mt-3 mb-1">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('**')) return <p key={i} className="text-xs text-slate-300 font-bold" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />;
                      if (line.startsWith('- ')) return <li key={i} className="text-xs text-slate-400 ml-4 list-disc">{line.replace('- ', '')}</li>;
                      if (line.trim()) return <p key={i} className="text-xs text-slate-400">{line}</p>;
                      return <br key={i} />;
                    })}
                  </div>
                </div>
              )}

              {!isGenerating && generatedRoadmap && (
                <button
                  onClick={handleRegenerate}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Roadmap
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex justify-between">
          {step > 1 && step < 4 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          
          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={generateAIRoadmap}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Roadmap
            </button>
          )}

          {step === 4 && !isGenerating && generatedRoadmap && (
            <button
              onClick={() => onComplete({
                dailyHours,
                studyStyle: 'Practice / Quiz',
                targetScore,
                weakSubjects,
                customRoadmap: generatedRoadmap,
                school,
                region,
                bio: `Aiming for ${targetScore}/600 in ${stream}`
              })}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              Start Learning
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
