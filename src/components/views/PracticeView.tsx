import { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Lightbulb, 
  Target, 
  Clock, 
  Play, 
  Award, 
  Lock, 
  FileText,
  HelpCircle,
  TrendingUp,
  Flame,
  ChevronRight,
  Info
} from 'lucide-react';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { PRACTICE_QUESTIONS_NEW } from '../../data/practiceQuestions';
import { Subject, Stream, Language, PracticeQuestion } from '../../types';
import { db } from '../../lib/supabase';

// Helper to extract all subjects and chapters for a given stream and grade
const getSubjectsAndChapters = (stream: Stream, gradeFilter: number | 'All' = 'All') => {
  const streamKey = stream === 'Natural Science' ? 'Natural' : 'Social';
  const curStream = ETHIOPIAN_CURRICULUM.find(s => s.stream === streamKey);

  // Default subjects list
  const subjectsList: Subject[] = stream === 'Natural Science' 
    ? ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'SAT']
    : ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'SAT'];

  // For each subject, gather chapters
  const subjectChaptersMap: Record<Subject, string[]> = {} as any;

  subjectsList.forEach(subject => {
    const searchSubject = subject === 'Mathematics' ? 'Maths' : subject;
    const chaptersList: string[] = [];
    
    if (curStream) {
      const subjectCurriculums = curStream.subjects.filter(s => s.subject.toLowerCase() === searchSubject.toLowerCase());
      subjectCurriculums.forEach(sc => {
        // Filter by grade if a specific grade is selected
        if (gradeFilter !== 'All' && sc.grade !== gradeFilter) return;
        sc.chapters.forEach(ch => {
          if (ch.chapterName && ch.chapterName.trim()) {
            chaptersList.push(`Grade ${sc.grade} - Chapter ${ch.chapterNumber}: ${ch.chapterName}`);
          }
        });
      });
    }

    // If no chapters found in curriculum (for English, SAT, or missing subjs), provide structured fallback
    if (chaptersList.length === 0) {
      if (subject === 'English') {
        chaptersList.push(
          'Grade 11 - Unit 1: Reading & Grammar',
          'Grade 11 - Unit 2: Paragraph Writing',
          'Grade 12 - Unit 1: Listening & Conversation',
          'Grade 12 - Unit 2: Academic Writing & Vocabulary'
        );
      } else if (subject === 'SAT') {
        chaptersList.push(
          'Unit 1: Verbal Reasoning & Analogies',
          'Unit 2: Quantitative Reasoning (Math)',
          'Unit 3: Analytical Reasoning & Logic',
          'Unit 4: Reading Comprehension & Synonyms'
        );
      } else {
        chaptersList.push(
          'Grade 11 - Unit 1: Foundations & Core Principles',
          'Grade 11 - Unit 2: Intermediate Theory',
          'Grade 12 - Unit 1: Advanced Application & Case Studies',
          'Grade 12 - Unit 2: Comprehensive Review & Integration'
        );
      }
    }

    // Filter fallback chapters by grade if needed
    if (gradeFilter !== 'All') {
      const filtered = chaptersList.filter(ch => ch.includes(`Grade ${gradeFilter}`));
      if (filtered.length > 0) {
        subjectChaptersMap[subject] = filtered;
        return;
      }
    }

    subjectChaptersMap[subject] = chaptersList;
  });

  return {
    subjects: subjectsList,
    chaptersMap: subjectChaptersMap
  };
};

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PracticeViewProps {
  stream: Stream;
  language: Language;
  dailyUsed: number;
  dailyCap: number;
  isPremium: boolean;
  onIncrementUsage: () => boolean;
  onOpenUpgrade: () => void;
  onJumpToExplainer: (qText: string, subj: Subject) => void;
  onNavigate?: (tab: string) => void;
  initialSubject?: Subject;
  initialAutoStart?: boolean;
  onClearInitial?: () => void;
  onCompletePractice?: (subject: Subject, chapter: string, correct: number, total: number, durationMinutes: number) => void;
}

type SessionState = 'config' | 'active' | 'summary';

export default function PracticeView({
  stream,
  language,
  dailyUsed,
  dailyCap,
  isPremium,
  onIncrementUsage,
  onOpenUpgrade,
  onJumpToExplainer,
  onNavigate,
  initialSubject,
  initialAutoStart,
  onClearInitial,
  onCompletePractice,
}: PracticeViewProps) {
  

  // State Machine
  const [sessionState, setSessionState] = useState<SessionState>('config');

  // Practice questions: merge static data with DB data
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>(PRACTICE_QUESTIONS_NEW);
  useEffect(() => {
    db.getQuestions({ questionType: 'practice' }).then(qs => {
      const staticIds = new Set(PRACTICE_QUESTIONS_NEW.map(q => q.id));
      const newDbOnly = qs.filter(q => !staticIds.has(q.id));
      setAllQuestions([...PRACTICE_QUESTIONS_NEW, ...newDbOnly]);
    }).catch(() => {
      setAllQuestions(PRACTICE_QUESTIONS_NEW);
    });
  }, []);

  // Config Filters
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedGrade, setSelectedGrade] = useState<number | 'All'>('All');
  const [selectedChapter, setSelectedChapter] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerMinutes, setTimerMinutes] = useState<number>(20); // 0 = Untimed

  // Memoized curriculum subjects and chapters map
  const subjectsAndChapters = useMemo(() => {
    return getSubjectsAndChapters(stream, selectedGrade);
  }, [stream, selectedGrade]);

  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
      if (initialAutoStart) {
        const pool = allQuestions.filter(q => (q.stream === stream || q.stream === 'Common') && q.subject === initialSubject);
        if (pool.length > 0) {
          const shuffled = fisherYatesShuffle(pool);
          const sessionItems = shuffled.slice(0, Math.min(10, pool.length));
          setActiveQuestions(sessionItems);
          setCurrentIndex(0);
          setUserAnswers({});
          setShowHint(false);
          setSecondsRemaining(20 * 60);
          setSessionState('active');
        }
      }
      if (onClearInitial) onClearInitial();
    }
  }, [initialSubject, initialAutoStart, stream, allQuestions]);

  // Active Session State
  const [activeQuestions, setActiveQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // qId -> optId
  const [showHint, setShowHint] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Filter base pool by stream
  const streamQuestions = useMemo(() => {
    return allQuestions.filter(q => q.stream === stream || q.stream === 'Common');
  }, [allQuestions, stream]);

  const availableSubjects = useMemo(() => {
    return subjectsAndChapters.subjects;
  }, [subjectsAndChapters]);

  const availableChapters = useMemo(() => {
    if (selectedSubject === 'All') {
      const all: string[] = [];
      subjectsAndChapters.subjects.forEach(subj => {
        all.push(...subjectsAndChapters.chaptersMap[subj]);
      });
      return Array.from(new Set(all)).sort();
    }
    return subjectsAndChapters.chaptersMap[selectedSubject] || [];
  }, [subjectsAndChapters, selectedSubject]);

  // Matching pool for configuration
  const matchingPool = useMemo(() => {
    // 1. Find exact real matches
    let exactRealMatches = streamQuestions.filter(q => {
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;
      
      // Filter by grade if selected (extract grade from chapter string like "Grade 12 - Chapter 1: ...")
      if (selectedGrade !== 'All') {
        const gradeMatch = (q.chapter || '').match(/Grade\s+(\d+)/i);
        if (!gradeMatch) return false; // Reject questions without grade prefix
        if (parseInt(gradeMatch[1]) !== selectedGrade) return false;
      }
      
      if (selectedChapter !== 'All') {
        const cleanQChapter = (q.chapter || '').toLowerCase();
        const cleanSelChapter = selectedChapter.toLowerCase();
        
        // Exact match (case-insensitive) — both use curriculum format "Grade 12 - Chapter X: Name"
        const isMatch = cleanQChapter === cleanSelChapter ||
                        // Substring match for fallback cases
                        cleanQChapter.includes(cleanSelChapter) ||
                        cleanSelChapter.includes(cleanQChapter);
        if (!isMatch) return false;
      }
      
      if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
      return true;
    });

    return exactRealMatches;
  }, [streamQuestions, selectedSubject, selectedGrade, selectedChapter, selectedDifficulty]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (sessionState !== 'active' || timerMinutes === 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionState('summary');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState, timerMinutes]);

  // Track session completion for History Tracker
  useEffect(() => {
    if (sessionState === 'summary' && activeQuestions.length > 0 && onCompletePractice) {
      const correct = activeQuestions.filter(q => userAnswers[q.id] === q.correctOptionId).length;
      const total = activeQuestions.length;
      const spentSecs = timerMinutes > 0 ? (timerMinutes * 60) - secondsRemaining : 120; // fallback to 2m if untimed
      const spentMins = Math.max(1, Math.round(spentSecs / 60));
      onCompletePractice(selectedSubject === 'All' ? 'Mathematics' : selectedSubject, selectedChapter || 'General Practice', correct, total, spentMins);
    }
  }, [sessionState]);

  // Handlers
  const handleStartSession = () => {
    if (matchingPool.length === 0) return;

    const shuffled = fisherYatesShuffle(matchingPool);
    const targetCount = questionCount === 999 ? matchingPool.length : Math.min(questionCount, matchingPool.length);
    const sessionItems = shuffled.slice(0, targetCount);

    setActiveQuestions(sessionItems);
    setCurrentIndex(0);
    setUserAnswers({});
    setShowHint(false);
    if (timerMinutes > 0) {
      setSecondsRemaining(timerMinutes * 60);
    }
    setSessionState('active');
  };

  const handleSelectOption = (qId: string, optId: string) => {
    if (userAnswers[qId]) return;

    const allowed = onIncrementUsage();
    if (!allowed) {
      onOpenUpgrade();
      return;
    }

    setUserAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Derive Current Item Details
  const currentQ = activeQuestions[currentIndex];
  const answeredOpt = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = !!answeredOpt;
  const isCorrect = currentQ && answeredOpt === currentQ.correctOptionId;

  // Summary statistics
  const totalAnswered = activeQuestions.length;
  const correctCount = activeQuestions.filter(q => userAnswers[q.id] === q.correctOptionId).length;
  const accuracyPercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // Academic Advice checklist helper
  const getSubjectConceptChecklist = (subj: string) => {
    switch (subj) {
      case 'Physics':
        return ['Electrostatics & Coulomb fields', 'Rotational mechanics and torque equilibrium', 'Thermodynamics & fluid gas dynamics'];
      case 'Chemistry':
        return ['Acid-Base conjugate pairs & pH buffers', 'Chemical equilibrium constants & Le Chatelier', 'Redox reaction balancing & stoichiometry'];
      case 'Mathematics':
        return ['Vector geometry & dot-cross products', 'Trigonometric identity simplifying', 'Limits, derivative rules & matrices'];
      case 'Biology':
        return ['Genetics cross schemes (Punnett)', 'Plant anatomy & cellular organelles', 'Human nervous and endocrine systems'];
      case 'English':
        return ['Active vs Passive sentence voices', 'Relative pronouns & clause combinations', 'Tense sequences and conditional if-clauses'];
      case 'History':
        return ['Capitalism & nationalism movements (1815-1914)', 'Colonial experience in Africa (1880s-1960s)', 'Ethiopian political developments (19th-20th century)'];
      case 'Geography':
        return ['Plate tectonics & geological processes', 'Climate change & environmental systems', 'Population policies & resource management'];
      case 'Economics':
        return ['Macroeconomic concepts & aggregate demand', 'Market failure & consumer protection', 'Tax theory & fiscal policy instruments'];
      case 'SAT':
        return ['Quantitative comparison & algebra', 'Text completion & reading comprehension', 'Analytical reasoning & logical fallacies'];
      default:
        return ['Curriculum syllabus outline verification', 'Official textbook concept summary review', 'Exam pacing & timing endurance drill'];
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-1 pb-4 font-sans select-none animate-fadeIn text-slate-100">

      {/* ═══════════ STATE 1: SESSION CONFIG ═══════════ */}
      {sessionState === 'config' && (
        <div className="space-y-4">

          {/* Compact Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-tight">Configure Practice Session</h1>
              <p className="text-xs text-slate-400">Select your subject, difficulty, and drill length to begin.</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* LEFT: All Settings in one card */}
            <div className="lg:col-span-2 bg-[#131E32] rounded-2xl border border-slate-800/60 p-5">
              <div className="space-y-4">

                {/* Subject & Grade & Chapter */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value as any); setSelectedChapter('All'); }}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
                      >
                        <option value="All">All Subjects</option>
                        {availableSubjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Grade</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => { setSelectedGrade(e.target.value === 'All' ? 'All' : parseInt(e.target.value)); setSelectedChapter('All'); }}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
                      >
                        <option value="All">All Grades</option>
                        <option value={9}>Grade 9</option>
                        <option value={10}>Grade 10</option>
                        <option value={11}>Grade 11</option>
                        <option value={12}>Grade 12</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Chapter / Unit</label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-teal-500 transition-all cursor-pointer truncate"
                      >
                        <option value="All">All Chapters</option>
                        {availableChapters.map(ch => (
                          <option key={ch} value={ch}>{ch.length > 50 ? ch.slice(0, 47) + '...' : ch}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Drill Length */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    Session Drill Length
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 999].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer border ${
                          questionCount === num
                            ? 'bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-lg shadow-teal-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {num === 999 ? 'Max' : num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Academic Difficulty
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff as any)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                          selectedDifficulty === diff
                            ? 'bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-lg shadow-teal-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Exam Countdown Timer
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: '10 min', val: 10 },
                      { label: '20 min', val: 20 },
                      { label: '45 min', val: 45 },
                      { label: 'No Timer', val: 0 },
                    ].map(t => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setTimerMinutes(t.val)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                          timerMinutes === t.val
                            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom status */}
              <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {timerMinutes > 0 ? `${timerMinutes} min timer` : 'Untimed'}
                </span>
                {!isPremium && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Lock className="w-3 h-3" />
                    Daily: {dailyUsed}/{dailyCap}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: Insights Panel */}
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-5 flex flex-col gap-4">

              {/* Match Count — compact */}
              <div className="text-center pb-3 border-b border-slate-800/50">
                <span className="text-4xl font-black text-white tabular-nums">{matchingPool.length}</span>
                <span className="text-xs text-slate-500 font-bold uppercase ml-1">Qs available</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {matchingPool.length > 0 ? 'Questions matched' : 'No matches — adjust filters'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded-xl py-2.5 text-center border border-slate-800/40">
                  <div className="text-lg font-black text-teal-400">{timerMinutes || '∞'}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Min</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl py-2.5 text-center border border-slate-800/40">
                  <div className="text-lg font-black text-emerald-400">{questionCount === 999 ? 'All' : questionCount}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Qs</div>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="pb-3 border-b border-slate-800/50">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5 text-teal-400" />
                  Focus Areas
                </label>
                <div className="space-y-1.5">
                  {getSubjectConceptChecklist(selectedSubject === 'All' ? 'Mathematics' : selectedSubject).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-0.5">
                      <div className="w-4 h-4 rounded bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[9px] text-teal-400 font-black shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-300 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Pass */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-400 uppercase">Daily Pass</span>
                  <span className="font-black text-white">{dailyUsed}/{dailyCap}</span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (dailyUsed / (dailyCap || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {isPremium ? 'PRO — Unlimited passes' : `${dailyCap - dailyUsed} passes left today`}
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartSession}
                disabled={matchingPool.length === 0}
                className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  matchingPool.length > 0
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Play className="w-4 h-4 fill-slate-950" />
                {matchingPool.length === 0
                  ? 'No Matching Questions'
                  : `Start Practice (${Math.min(questionCount === 999 ? matchingPool.length : questionCount, matchingPool.length)} Qs)`}
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>
      )}


      {/* ═══════════ STATE 2: ACTIVE PRACTICE ARENA ═══════════ */}
      {sessionState === 'active' && currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-0">

          {/* LEFT: Question (8 cols) */}
          <div className="lg:col-span-8 space-y-3 min-h-0 flex flex-col">

            {/* Top Bar */}
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setSessionState('config')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Exit
              </button>

              {/* Progress Bar */}
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-slate-800/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-black text-white tabular-nums shrink-0">
                  {currentIndex + 1}<span className="text-slate-500 font-normal">/{activeQuestions.length}</span>
                </span>
              </div>

              {/* Timer */}
              {timerMinutes > 0 ? (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs shrink-0 border transition-all ${
                  secondsRemaining <= 60
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(secondsRemaining)}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-bold shrink-0 px-2">Untimed</div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-5 sm:p-6 space-y-5 flex-1 min-h-0 overflow-y-auto no-scrollbar">

              {/* Chapter & Difficulty Tags */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 truncate max-w-[70%]">{currentQ.chapter}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  currentQ.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : currentQ.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>

              {/* Passage (if exists) */}
              {currentQ.passage && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Reading Passage</span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: currentQ.passage }} />
                </div>
              )}

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.questionText }} />

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answeredOpt === opt.id;
                  const isOptCorrect = opt.id === currentQ.correctOptionId;

                  let style = 'bg-slate-900/50 border-slate-800/80 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300';
                  if (isAnswered) {
                    if (isOptCorrect) {
                      style = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-500/10';
                    } else if (isSelected) {
                      style = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
                    } else {
                      style = 'bg-slate-950/30 border-slate-900/60 opacity-30';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      disabled={isAnswered}
                      className={`p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${style}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black uppercase text-xs shrink-0 transition-colors ${
                        isAnswered && isOptCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isAnswered && isSelected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="flex-1 pt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: opt.text }} />
                      {isAnswered && isOptCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />}
                      {isAnswered && isSelected && !isOptCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              {!isAnswered && (
                <div>
                  {!showHint ? (
                    <button
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 cursor-pointer transition-colors"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Stuck? Reveal Hint
                    </button>
                  ) : (
                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-3 animate-fadeIn">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-amber-300 block mb-1">Academic Clue</span>
                        Focus on the primary governing relationships of {currentQ.subject} — {currentQ.chapter.split(':').pop()?.trim()}.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {isAnswered && (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-teal-500/20 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      Verified Solution
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                      {isCorrect ? '+25 XP' : 'Needs Review'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
                  <div className="flex justify-end">
                    <button
                      onClick={() => onJumpToExplainer(currentQ.questionText, currentQ.subject)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[11px] font-black transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      Ask AI Tutor
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                <button
                  onClick={() => { setShowHint(false); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
                  disabled={currentIndex === 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentIndex > 0 ? 'bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer' : 'opacity-30 cursor-not-allowed text-slate-500'
                  }`}
                >
                  ← Previous
                </button>

                {currentIndex < activeQuestions.length - 1 ? (
                  <button
                    onClick={() => { setShowHint(false); setCurrentIndex(prev => prev + 1); }}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
                  >
                    Next Question
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setSessionState('summary')}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Complete Practice
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: Monitor Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-[#131E32] border border-slate-800/60 rounded-2xl p-4 space-y-4 shadow-xl">

            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-teal-400" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Arena Monitor</h4>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Answered</div>
                <div className="text-xl font-black text-white mt-1">
                  {Object.keys(userAnswers).length}<span className="text-xs text-slate-500 font-normal">/{activeQuestions.length}</span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Correct</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {activeQuestions.filter(q => userAnswers[q.id] === q.correctOptionId).length}
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Question Map</label>
              <div className="grid grid-cols-5 gap-1.5">
                {activeQuestions.map((q, idx) => {
                  const answered = userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  const correct = answered === q.correctOptionId;

                  let btnStyle = 'bg-slate-900/60 text-slate-500 border-slate-800/60 hover:bg-slate-800/60 hover:text-slate-300';
                  if (isCurrent) {
                    btnStyle = 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-lg shadow-teal-500/20';
                  } else if (answered) {
                    btnStyle = correct
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`aspect-square rounded-xl border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                <Info className="w-3 h-3" />
                Study Tip
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Read verified explanations for both correct and incorrect answers to reinforce your understanding.
              </p>
            </div>

          </div>

        </div>
      )}


      {/* ═══════════ STATE 3: SESSION SUMMARY ═══════════ */}
      {sessionState === 'summary' && (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">

          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1929] via-[#132238] to-[#0f1d30] border border-slate-800/60 p-8 text-center">
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center mx-auto text-slate-950 shadow-2xl shadow-teal-500/30">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Practice Complete!</h2>
                <p className="text-sm text-slate-400 mt-1">Here is your entrance exam readiness scorecard.</p>
              </div>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-3xl font-black text-white">{accuracyPercent}%</span>
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</div>
                  <div className="text-sm font-black text-teal-400">
                    {accuracyPercent >= 80 ? 'Summa Scholar' : accuracyPercent >= 60 ? 'Passing Merit' : 'Needs Revision'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-black text-white">{correctCount}<span className="text-lg text-slate-500 font-normal">/{totalAnswered}</span></div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Score</div>
            </div>
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-black text-teal-400">{accuracyPercent}%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Accuracy</div>
            </div>
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-black text-amber-400">{timerMinutes || '∞'}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Minutes</div>
            </div>
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-black text-emerald-400">{totalAnswered}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Questions</div>
            </div>
          </div>

          {/* Advice & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Recommendation */}
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Scholar Recommendation</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Review step-by-step verified explanations in the question navigator.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Open Study Hub to read targeted formulas for this chapter.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{accuracyPercent >= 60 ? 'Great progress! Move to more advanced chapters.' : 'Focus on fundamentals before retaking this session.'}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="bg-[#131E32] rounded-2xl border border-slate-800/60 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Next Steps</h3>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={() => setSessionState('config')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                  New Practice Session
                </button>
                <button
                  onClick={() => { setSessionState('config'); onNavigate?.('dashboard'); }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  Back to Dashboard
                </button>
                <button
                  onClick={onOpenUpgrade}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Unlock Pro Unlimited
                </button>
              </div>
              <p className="text-[9px] text-slate-500 text-center">Evaluated on {new Date().toLocaleDateString()}</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
