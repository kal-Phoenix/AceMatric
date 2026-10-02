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
  TrendingUp,
  Flame,
  ChevronRight,
  Info,
  X,
  Menu,
} from 'lucide-react';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import { Subject, Stream, Language, PracticeQuestion } from '../../types';
import { db } from '../../lib/supabase';
import { sanitizeHtml } from '../../lib/sanitize';

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
          'Grade 12 - Unit 2: Writing & Vocabulary'
        );
      } else if (subject === 'SAT') {
        chaptersList.push(
          'Grade 9 - Chapter 1: Numbers and Operations',
          'Grade 9 - Chapter 2: Algebra and Functions',
          'Grade 9 - Chapter 3: Geometry and Measurement',
          'Grade 9 - Chapter 4: Data Analysis and Probability',
          'Grade 9 - Chapter 5: Advanced Mathematics',
          'Grade 9 - Chapter 6: Problem Solving Strategies',
          'Grade 9 - Chapter 7: Critical Reading',
          'Grade 9 - Chapter 8: Writing and Language',
          'Grade 9 - Chapter 9: Essay Writing',
          'Grade 9 - Chapter 10: Vocabulary in Context',
          'Grade 9 - Chapter 11: Informational Graphics',
          'Grade 9 - Chapter 12: Evidence-Based Reasoning',
          'Grade 9 - Chapter 13: Pairs of Quantities',
          'Grade 9 - Chapter 14: Ratios and Proportional Relationships',
          'Grade 9 - Chapter 15: Percentage and Percent Change',
          'Grade 9 - Chapter 16: Data Interpretation',
          'Grade 9 - Chapter 17: Science Passage Analysis',
          'Grade 9 - Chapter 18: Social Science Passage Analysis',
          'Grade 9 - Chapter 19: Historical Passage Analysis',
          'Grade 9 - Chapter 20: Literary Passage Analysis',
          'Grade 9 - Chapter 21: Writing Revision',
          'Grade 9 - Chapter 22: Idioms and Common Expressions',
          'Grade 10 - Chapter 1: Numbers and Operations',
          'Grade 10 - Chapter 2: Algebra and Functions',
          'Grade 10 - Chapter 3: Geometry and Measurement',
          'Grade 10 - Chapter 4: Data Analysis and Probability',
          'Grade 10 - Chapter 5: Advanced Mathematics',
          'Grade 10 - Chapter 6: Problem Solving Strategies',
          'Grade 10 - Chapter 7: Critical Reading',
          'Grade 10 - Chapter 8: Writing and Language',
          'Grade 10 - Chapter 9: Essay Writing',
          'Grade 10 - Chapter 10: Vocabulary in Context',
          'Grade 10 - Chapter 11: Informational Graphics',
          'Grade 10 - Chapter 12: Evidence-Based Reasoning',
          'Grade 10 - Chapter 13: Pairs of Quantities',
          'Grade 10 - Chapter 14: Ratios and Proportional Relationships',
          'Grade 10 - Chapter 15: Percentage and Percent Change',
          'Grade 10 - Chapter 16: Data Interpretation',
          'Grade 10 - Chapter 17: Science Passage Analysis',
          'Grade 10 - Chapter 18: Social Science Passage Analysis',
          'Grade 10 - Chapter 19: Historical Passage Analysis',
          'Grade 10 - Chapter 20: Literary Passage Analysis',
          'Grade 10 - Chapter 21: Writing Revision',
          'Grade 10 - Chapter 22: Idioms and Common Expressions',
          'Grade 11 - Chapter 1: Numbers and Operations',
          'Grade 11 - Chapter 2: Algebra and Functions',
          'Grade 11 - Chapter 3: Geometry and Measurement',
          'Grade 11 - Chapter 4: Data Analysis and Probability',
          'Grade 11 - Chapter 5: Advanced Mathematics',
          'Grade 11 - Chapter 6: Problem Solving Strategies',
          'Grade 11 - Chapter 7: Critical Reading',
          'Grade 11 - Chapter 8: Writing and Language',
          'Grade 11 - Chapter 9: Essay Writing',
          'Grade 11 - Chapter 10: Vocabulary in Context',
          'Grade 11 - Chapter 11: Informational Graphics',
          'Grade 11 - Chapter 12: Evidence-Based Reasoning',
          'Grade 11 - Chapter 13: Pairs of Quantities',
          'Grade 11 - Chapter 14: Ratios and Proportional Relationships',
          'Grade 11 - Chapter 15: Percentage and Percent Change',
          'Grade 11 - Chapter 16: Data Interpretation',
          'Grade 11 - Chapter 17: Science Passage Analysis',
          'Grade 11 - Chapter 18: Social Science Passage Analysis',
          'Grade 11 - Chapter 19: Historical Passage Analysis',
          'Grade 11 - Chapter 20: Literary Passage Analysis',
          'Grade 11 - Chapter 21: Writing Revision',
          'Grade 11 - Chapter 22: Idioms and Common Expressions',
          'Grade 12 - Chapter 1: Numbers and Operations',
          'Grade 12 - Chapter 2: Algebra and Functions',
          'Grade 12 - Chapter 3: Geometry and Measurement',
          'Grade 12 - Chapter 4: Data Analysis and Probability',
          'Grade 12 - Chapter 5: Advanced Mathematics',
          'Grade 12 - Chapter 6: Problem Solving Strategies',
          'Grade 12 - Chapter 7: Critical Reading',
          'Grade 12 - Chapter 8: Writing and Language',
          'Grade 12 - Chapter 9: Essay Writing',
          'Grade 12 - Chapter 10: Vocabulary in Context',
          'Grade 12 - Chapter 11: Informational Graphics',
          'Grade 12 - Chapter 12: Evidence-Based Reasoning',
          'Grade 12 - Chapter 13: Pairs of Quantities',
          'Grade 12 - Chapter 14: Ratios and Proportional Relationships',
          'Grade 12 - Chapter 15: Percentage and Percent Change',
          'Grade 12 - Chapter 16: Data Interpretation',
          'Grade 12 - Chapter 17: Science Passage Analysis',
          'Grade 12 - Chapter 18: Social Science Passage Analysis',
          'Grade 12 - Chapter 19: Historical Passage Analysis',
          'Grade 12 - Chapter 20: Literary Passage Analysis',
          'Grade 12 - Chapter 21: Writing Revision',
          'Grade 12 - Chapter 22: Idioms and Common Expressions'
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
  const [showQuestionMap, setShowQuestionMap] = useState<boolean>(false);

  // Practice questions: load from database
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  useEffect(() => {
    db.getQuestions().then(qs => {
      setAllQuestions(qs);
    }).catch(() => {
      setAllQuestions([]);
    }).finally(() => {
      setQuestionsLoaded(true);
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
    if (initialSubject && questionsLoaded) {
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
  }, [initialSubject, initialAutoStart, stream, allQuestions, questionsLoaded]);

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
    const baseList = selectedSubject === 'All'
      ? allQuestions
      : allQuestions.filter(q => {
          const searchSubj = selectedSubject === 'Mathematics' ? 'Maths' : selectedSubject;
          return q.subject === searchSubj || q.subject === selectedSubject;
        });

    // 1. Find exact real matches
    let exactRealMatches = baseList.filter(q => {
      if (selectedSubject !== 'All') {
        const searchSubject = selectedSubject === 'Mathematics' ? 'Maths' : selectedSubject;
        if (q.subject !== searchSubject && q.subject !== selectedSubject) return false;
      }
      
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
  }, [allQuestions, selectedSubject, selectedGrade, selectedChapter, selectedDifficulty]);

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
    <div className="w-full max-w-7xl mx-auto pt-1 pb-4 font-sans select-none text-slate-100">

      {/* ═══════════ STATE 1: SESSION CONFIG ═══════════ */}
      {sessionState === 'config' && (
        <div className="space-y-4">

          {/* Compact Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight leading-tight">Configure Practice Session</h1>
              <p className="text-xs text-slate-400">Select your subject, difficulty, and drill length to begin.</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* LEFT: All Settings in one card */}
            <div className="lg:col-span-2 bg-[#0F1218] rounded-2xl border border-slate-800/60 p-5">
              <div className="space-y-4">

                {/* Subject & Grade & Chapter */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value as any); setSelectedChapter('All'); }}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="All">All Subjects</option>
                        {availableSubjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Grade</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => { setSelectedGrade(e.target.value === 'All' ? 'All' : parseInt(e.target.value)); setSelectedChapter('All'); }}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="All">All Grades</option>
                        <option value={9}>Grade 9</option>
                        <option value={10}>Grade 10</option>
                        <option value={11}>Grade 11</option>
                        <option value={12}>Grade 12</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chapter / Unit</label>
                      <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer truncate"
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    Session Drill Length
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 999].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                          questionCount === num
                            ? 'bg-blue-500/10 border-blue-500/60 text-blue-300 shadow-sm'
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Difficulty
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff as any)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                          selectedDifficulty === diff
                            ? 'bg-blue-500/10 border-blue-500/60 text-blue-300 shadow-sm'
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
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
                            ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 shadow-sm'
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
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
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
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-5 flex flex-col gap-4">

              {/* Match Count — compact */}
              <div className="text-center pb-3 border-b border-slate-800/50">
                <span className="text-4xl font-semibold text-white tabular-nums">{matchingPool.length}</span>
                <span className="text-xs text-slate-500 font-bold uppercase ml-1">Qs available</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {matchingPool.length > 0 ? 'Questions matched' : 'No matches — adjust filters'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded-xl py-2.5 text-center border border-slate-800/40">
                  <div className="text-lg font-semibold text-blue-400">{timerMinutes || '∞'}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Min</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl py-2.5 text-center border border-slate-800/40">
                  <div className="text-lg font-semibold text-emerald-400">{questionCount === 999 ? 'All' : questionCount}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Qs</div>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="pb-3 border-b border-slate-800/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Focus Areas
                </label>
                <div className="space-y-1.5">
                  {getSubjectConceptChecklist(selectedSubject === 'All' ? 'Mathematics' : selectedSubject).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-0.5">
                      <div className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-semibold shrink-0 mt-0.5">
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
                  <span className="font-semibold text-slate-400 uppercase">Daily Pass</span>
                  <span className="font-semibold text-white">{dailyUsed}/{dailyCap}</span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (dailyUsed / (dailyCap || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {isPremium ? 'PRO — Unlimited passes' : `${dailyCap - dailyUsed} passes left today`}
                </p>
              </div>

              {/* Start Button */}
              {!questionsLoaded ? (
                <div className="w-full py-3 rounded-xl bg-slate-800/80 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 border border-slate-700/50">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Loading questions...
                </div>
              ) : (
                <button
                  onClick={handleStartSession}
                  disabled={matchingPool.length === 0}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    matchingPool.length > 0
                      ? 'bg-blue-600 text-white shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  {matchingPool.length === 0
                    ? 'No Matching Questions'
                    : `Start Practice (${Math.min(questionCount === 999 ? matchingPool.length : questionCount, matchingPool.length)} Qs)`}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

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
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3">
              <button
                onClick={() => setSessionState('config')}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 transition-all cursor-pointer shrink-0 touch-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Exit</span>
              </button>

              {/* Progress Bar & Clickable Question Map trigger */}
              <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex-1 bg-slate-800/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuestionMap(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-bold shrink-0 touch-btn hover:bg-blue-500/20 cursor-pointer"
                  title="Open Question Map"
                >
                  <span className="tabular-nums">{currentIndex + 1}/{activeQuestions.length}</span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
              </div>

              {/* Timer */}
              {timerMinutes > 0 ? (
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono font-semibold text-xs shrink-0 border transition-all ${
                  secondsRemaining <= 60
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(secondsRemaining)}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-bold shrink-0 px-1.5">Untimed</div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-5 sm:p-6 space-y-5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto no-scrollbar">

              {/* Chapter & Difficulty Tags */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 truncate max-w-[70%]">{currentQ.chapter}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
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
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Reading Passage</span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.passage) }} />
                </div>
              )}

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.questionText) }} />

              {/* Image Placeholder */}
              {currentQ.hasImage && currentQ.imagePlaceholder && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-center min-h-[120px]">
                  <div className="text-center">
                    <div className="text-4xl mb-2"></div>
                    <p className="text-slate-400 text-sm font-medium">{currentQ.imagePlaceholder}</p>
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answeredOpt === opt.id;
                  const isOptCorrect = opt.id === currentQ.correctOptionId;

                  let style = 'bg-slate-900/50 border-slate-800/80 hover:border-slate-600 hover:bg-slate-800/50 text-slate-300';
                  if (isAnswered) {
                    if (isOptCorrect) {
                      style = 'bg-emerald-500/10 border-emerald-500/60 text-emerald-200 shadow-sm';
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
                      className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-sm font-medium transition-all flex items-start gap-3 cursor-pointer min-h-[52px] touch-btn ${style}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold uppercase text-xs shrink-0 transition-colors ${
                        isAnswered && isOptCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isAnswered && isSelected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="flex-1 pt-1 leading-relaxed text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text) }} />
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
                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300 block mb-1">Clue</span>
                        Focus on the primary governing relationships of {currentQ.subject} — {currentQ.chapter.split(':').pop()?.trim()}.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {isAnswered && (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      Verified Solution
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                      {isCorrect ? '+25 XP' : 'Needs Review'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.explanation) }} />
                  <div className="flex justify-end">
                    <button
                      onClick={() => onJumpToExplainer(currentQ.questionText, currentQ.subject)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Ask AI Tutor
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center justify-between pt-3 border-t border-slate-800/50">
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
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    Next Question
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setSessionState('summary')}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    Complete Practice
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>

            {/* STICKY BOTTOM DOCK ON MOBILE FOR FAST SOLVING */}
            <div className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 px-3.5 py-2.5 glass-nav border-t border-white/[0.08] shadow-2xl flex items-center justify-between gap-2">
              <button
                onClick={() => { setShowHint(false); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
                disabled={currentIndex === 0}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all touch-btn ${
                  currentIndex > 0
                    ? 'bg-slate-800/90 text-white border border-white/[0.1] cursor-pointer'
                    : 'opacity-30 cursor-not-allowed text-slate-500 bg-slate-900/50'
                }`}
              >
                ← Prev
              </button>

              {isAnswered && (
                <button
                  onClick={() => onJumpToExplainer(currentQ.questionText, currentQ.subject)}
                  className="px-3 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5 touch-btn cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Tutor</span>
                </button>
              )}

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  onClick={() => { setShowHint(false); setCurrentIndex(prev => prev + 1); }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 touch-btn cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setSessionState('summary')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 touch-btn cursor-pointer"
                >
                  <span>Complete</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Question Map Bottom Sheet */}
            {showQuestionMap && (
              <div
                className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4"
                onClick={() => setShowQuestionMap(false)}
                role="presentation"
              >
                <div
                  className="w-full max-w-lg glass-sheet border border-white/[0.1] rounded-t-[28px] sm:rounded-2xl p-5 space-y-4 animate-sheet-up max-h-[80vh] flex flex-col"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                  onClick={e => e.stopPropagation()}
                  role="dialog"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Question Navigator</h3>
                      <p className="text-[11px] text-slate-400">
                        {Object.keys(userAnswers).length} of {activeQuestions.length} answered • {activeQuestions.filter(q => userAnswers[q.id] === q.correctOptionId).length} correct
                      </p>
                    </div>
                    <button
                      onClick={() => setShowQuestionMap(false)}
                      className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 overflow-y-auto p-1 mobile-scroll max-h-[50vh]">
                    {activeQuestions.map((q, idx) => {
                      const isAnsweredQ = !!userAnswers[q.id];
                      const isCurrent = idx === currentIndex;
                      const isCorrect = userAnswers[q.id] === q.correctOptionId;

                      let btnClass = 'bg-slate-900 border-white/[0.08] text-slate-400';
                      if (isAnsweredQ) {
                        btnClass = isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold';
                      }
                      if (isCurrent) {
                        btnClass = 'ring-2 ring-blue-500 bg-blue-600 text-white font-extrabold shadow-md';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setShowHint(false);
                            setCurrentIndex(idx);
                            setShowQuestionMap(false);
                          }}
                          className={`h-11 rounded-xl border flex items-center justify-center text-xs font-bold transition-all touch-btn cursor-pointer ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Desktop Monitor Sidebar (hidden on mobile to prevent scrolling clutter) */}
          <div className="hidden lg:block lg:col-span-4 bg-[#0F1218] border border-slate-800/60 rounded-2xl p-4 space-y-4 shadow-sm">

            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Monitor</h4>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Answered</div>
                <div className="text-xl font-semibold text-white mt-1">
                  {Object.keys(userAnswers).length}<span className="text-xs text-slate-500 font-normal">/{activeQuestions.length}</span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Correct</div>
                <div className="text-xl font-semibold text-emerald-400 mt-1">
                  {activeQuestions.filter(q => userAnswers[q.id] === q.correctOptionId).length}
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Question Map</label>
              <div className="grid grid-cols-5 gap-1.5">
                {activeQuestions.map((q, idx) => {
                  const answered = userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  const correct = answered === q.correctOptionId;

                  let btnStyle = 'bg-slate-900/60 text-slate-500 border-slate-800/60 hover:bg-slate-800/60 hover:text-slate-300';
                  if (isCurrent) {
                    btnStyle = 'bg-blue-600 text-white font-semibold border-blue-400 shadow-sm';
                  } else if (answered) {
                    btnStyle = correct
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`aspect-square rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3 space-y-1.5">
              <span className="text-xs font-semibold text-amber-400 uppercase flex items-center gap-1">
                <Info className="w-3 h-3" />
                Study Tip
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Read verified explanations for both correct and incorrect answers to reinforce your understanding.
              </p>
            </div>

          </div>

        </div>
      )}


      {/* ═══════════ STATE 3: SESSION SUMMARY ═══════════ */}
      {sessionState === 'summary' && (
        <div className="space-y-6 max-w-5xl mx-auto">

          {/* Hero Card */}
          <div className="relative overflow-hidden rounded-xl bg-[#0F1218] border border-slate-800/60 p-8 text-center">
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 rounded-xl bg-blue-400 flex items-center justify-center mx-auto text-slate-950 shadow-xl">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Practice Complete!</h2>
                <p className="text-sm text-slate-400 mt-1">Here is your entrance exam readiness scorecard.</p>
              </div>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <span className="text-3xl font-semibold text-white">{accuracyPercent}%</span>
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Accuracy</div>
                  <div className="text-sm font-semibold text-blue-400">
                    {accuracyPercent >= 80 ? 'Summa Scholar' : accuracyPercent >= 60 ? 'Passing Merit' : 'Needs Revision'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-semibold text-white">{correctCount}<span className="text-lg text-slate-500 font-normal">/{totalAnswered}</span></div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Score</div>
            </div>
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-semibold text-blue-400">{accuracyPercent}%</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Accuracy</div>
            </div>
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-semibold text-amber-400">{timerMinutes || '∞'}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Minutes</div>
            </div>
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-4 text-center">
              <div className="text-3xl font-semibold text-emerald-400">{totalAnswered}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Questions</div>
            </div>
          </div>

          {/* Advice & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Recommendation */}
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Scholar Recommendation</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Review step-by-step verified explanations in the question navigator.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Open Study Hub to read targeted formulas for this chapter.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{accuracyPercent >= 60 ? 'Great progress! Move to more advanced chapters.' : 'Focus on fundamentals before retaking this session.'}</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="bg-[#0F1218] rounded-2xl border border-slate-800/60 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Play className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Next Steps</h3>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={() => setSessionState('config')}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  New Practice Session
                </button>
                <button
                  onClick={() => { setSessionState('config'); onNavigate?.('dashboard'); }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                  Back to Dashboard
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">Evaluated on {new Date().toLocaleDateString()}</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
