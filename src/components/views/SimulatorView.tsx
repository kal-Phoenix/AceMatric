
import { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Award, RotateCcw, ArrowRight, Lock, Sparkles, BookOpen, Check, Play, FileText, ChevronRight, Flag } from 'lucide-react';
import { Stream, Language, MockExam, Subject, PracticeQuestion } from '../../types';
import { db } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import { sanitizeHtml } from '../../lib/sanitize';

interface SimulatorViewProps {
  stream: Stream;
  language: Language;
  isPremium: boolean;
  onOpenUpgrade: () => void;
  onCompleteMock: (mockId: string, scorePct: number) => void;
  onJumpToExplainer: (qText: string, subj: string) => void;
  initialMockId?: string;
}

export default function SimulatorView({
  stream,
  language,
  isPremium,
  onOpenUpgrade,
  onCompleteMock,
  onJumpToExplainer,
  initialMockId,
}: SimulatorViewProps) {
  // Mock exams and questions from Supabase
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([]);
  const [pastExams, setPastExams] = useState<any[]>([]);
  useEffect(() => {
    db.getMockExams({ stream }).then(setMockExams).catch(() => {});
    db.getQuestions().then(setAllQuestions).catch(() => {});
    db.getPastExams().then(setPastExams).catch(() => {});
  }, [stream]);
  const streamMocks = mockExams.filter((m) => m.stream === stream);
  const activeMocks = streamMocks.length > 0 ? streamMocks : [];
  const [selectedSubject, setSelectedSubject] = useState<Subject>(stream === 'Natural Science' ? 'Physics' : 'Economics');
  const [selectedYear, setSelectedYear] = useState<number>(2016);
  const [simulatorMode, setSimulatorMode] = useState<'grand' | 'past'>('past');
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  const availableYears = useMemo(() => {
    const filtered = pastExams.filter(pe => pe.subject === selectedSubject);
    const fromApi = filtered.map(pe => Number(pe.yearEC) || Number(pe.title?.match(/\d{4}/)?.[0]) || 0).filter(Boolean);
    const result = [...new Set(fromApi)].sort((a, b) => a - b);
    return result;
  }, [pastExams, selectedSubject]);

  // Auto-select first available year when subject changes
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  const pastExamEntry = useMemo(() => {
    return pastExams.find(pe => pe.subject === selectedSubject && (String(pe.yearEC) === String(selectedYear) || Number(pe.title.match(/\d{4}/)?.[0]) === selectedYear)) || null;
  }, [pastExams, selectedSubject, selectedYear]);

  const pastExamQuestions: PracticeQuestion[] = useMemo(() => {
    if (!pastExamEntry?.questions) return [];
    // The API withholds the answer key — it arrives after server-side grading
    return pastExamEntry.questions.map((q: any) => ({
      id: q.id,
      subject: pastExamEntry.subject,
      stream,
      chapter: '',
      yearEC: `${pastExamEntry.yearEC} E.C.`,
      questionText: q.question,
      options: (q.options || []).map((text: string, i: number) => ({
        id: ['a','b','c','d'][i] || String(i),
        text,
      })),
      correctOptionId: '',
      explanation: '',
      difficulty: 'Medium',
    }));
  }, [pastExamEntry, stream]);

  const pastExamMock: MockExam = useMemo(() => {
    return {
      id: pastExamEntry?.id || `past-${selectedSubject.toLowerCase()}-${selectedYear}`,
      title: pastExamEntry?.title || `${selectedYear} G.C. ${selectedSubject} Exam`,
      stream,
      subject: selectedSubject,
      durationMinutes: pastExamEntry?.durationMinutes || 40,
      totalQuestions: pastExamEntry?.totalQuestions || pastExamQuestions.length,
      questionIds: pastExamQuestions.map(q => q.id),
    };
  }, [pastExamEntry, pastExamQuestions, selectedSubject, selectedYear, stream]);
  const [selectedMock, setSelectedMock] = useState<MockExam | null>(
    initialMockId ? (mockExams.find(m => m.id === initialMockId) || activeMocks[0] || null) : (activeMocks[0] || null)
  );
  useEffect(() => {
    if (initialMockId && mockExams.length > 0) {
      const match = mockExams.find(m => m.id === initialMockId);
      if (match) setSelectedMock(match);
    }
  }, [initialMockId, mockExams]);
  const currentMock = simulatorMode === 'grand' ? selectedMock : pastExamMock;
  const safeMock = currentMock || { id: 'empty', title: 'No Exam Selected', stream, subject: '', durationMinutes: 45, totalQuestions: 0, questionIds: [] as string[] };

  const [isActive, setIsActive] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(safeMock.durationMinutes * 60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const userAnswersRef = useRef<Record<string, string>>({});
  const submitExamRef = useRef<() => void>(() => {});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  // Answer key returned by POST /:id/grade, keyed by question id
  const [gradedQuestions, setGradedQuestions] = useState<Record<string, { correctOptionId: string; explanation: string }> | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  // Proctoring: detect tab switches during exam
  useEffect(() => {
    if (!isActive || isSubmitted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          if (next >= 3) setShowProctorWarning(true);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, isSubmitted]);
  // Warn before leaving during an active exam
  useEffect(() => {
    if (!isActive || isSubmitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isActive, isSubmitted]);
  // Sync timer when currentMock changes
  useEffect(() => {
    setTimeLeftSeconds(safeMock.durationMinutes * 60);
    setCurrentIndex(0);
    setUserAnswers({});
    userAnswersRef.current = {};
    setIsSubmitted(false);
    setIsActive(false);
    setFlaggedQuestions({});
    setGradedQuestions(null);
    setGradeError(null);
    setIsGrading(false);
    setScorePercent(0);
  }, [safeMock.id]);
  // Countdown timer - use ref for submit callback to avoid stale closure
  useEffect(() => {
    if (!isActive || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          setTimeout(() => submitExamRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isSubmitted]);

  let mockQuestions: PracticeQuestion[] = [];
  if (simulatorMode === 'past') {
    mockQuestions = pastExamQuestions;
  } else {
    mockQuestions = allQuestions.filter((q) => safeMock.questionIds.includes(q.id));
  }

  // Once the server grades a past-paper attempt, fold the answer key into the
  // rendered questions so the review screens can highlight correct answers.
  if (gradedQuestions) {
    mockQuestions = mockQuestions.map((q) => {
      const graded = gradedQuestions[q.id];
      return graded ? { ...q, correctOptionId: graded.correctOptionId, explanation: graded.explanation } : q;
    });
  }

  const currentQ = mockQuestions[currentIndex] || mockQuestions[0];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const handleStart = () => {
    if (!isPremium) {
      if (simulatorMode === 'grand' && safeMock.id !== activeMocks[0]?.id) {
        onOpenUpgrade();
        return;
      }
    }
    if (mockQuestions.length === 0) return;
    setIsActive(true);
  };
  const toggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };
  const handleAnswer = (qId: string, optId: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => {
      const next = { ...prev, [qId]: optId };
      userAnswersRef.current = next;
      return next;
    });
  };
  const finishSubmit = (pct: number) => {
    setScorePercent(pct);
    setIsSubmitted(true);
    setGradeError(null);
    onCompleteMock(safeMock.id, pct);
    if (pct >= 60) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const submitExam = async () => {
    if (isGrading || isSubmitted) return;
    setIsActive(false); // stop the timer immediately
    setGradeError(null);

    // Past papers are graded server-side because the API never ships the key.
    if (simulatorMode === 'past' && pastExamEntry?.id) {
      setIsGrading(true);
      try {
        const outcome = await db.gradePastExam(pastExamEntry.id, userAnswersRef.current);
        const key: Record<string, { correctOptionId: string; explanation: string }> = {};
        for (const r of outcome.results) {
          if (r.correctOptionId) {
            key[r.id] = { correctOptionId: r.correctOptionId, explanation: r.explanation || '' };
          }
        }
        setGradedQuestions(key);
        finishSubmit(outcome.pct);
      } catch (err: any) {
        setGradeError(err?.message || 'We could not reach the grading service.');
      } finally {
        setIsGrading(false);
      }
      return;
    }

    // Grand mocks pull from the question bank, which carries the key locally.
    let correct = 0;
    const answers = userAnswersRef.current;
    mockQuestions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        correct += 1;
      }
    });
    finishSubmit(Math.round((correct / (mockQuestions.length || 1)) * 100));
  };
  submitExamRef.current = submitExam;
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = mockQuestions.length - answeredCount;
  return (
    <div className="w-full max-w-7xl mx-auto py-1.5 lg:py-1 px-3 sm:px-4 font-sans select-none space-y-3 lg:space-y-2 text-slate-100">
      {/* Proctor Warning Modal */}
      {showProctorWarning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141920] border border-rose-500/30 rounded-xl p-8 max-w-md w-full text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Exam Integrity Warning</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              You have switched tabs <span className="text-amber-400 font-semibold">{tabSwitchCount} times</span> during this exam.
              Continued tab switching may result in your exam being flagged.
            </p>
            <p className="text-xs text-slate-500">
              This exam monitors tab focus to ensure fair testing conditions.
            </p>
            <button
              onClick={() => setShowProctorWarning(false)}
              className="px-8 py-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
      {/* Grading overlay — answer key is fetched from the server at submit time */}
      {isGrading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141920] border border-slate-800 rounded-xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-white">Grading your exam…</p>
            <p className="text-xs text-slate-400">Checking your answers against the official key.</p>
          </div>
        </div>
      )}
      {/* Grading failure — keep the attempt and let the student retry */}
      {gradeError && !isGrading && !isSubmitted && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141920] border border-rose-500/30 rounded-xl p-8 max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Grading failed</h2>
              <p className="text-sm text-slate-300">{gradeError} Your answers are still saved — try again.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setGradeError(null); submitExam(); }}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Retry grading
              </button>
              <button
                onClick={() => { setGradeError(null); setIsActive(false); setIsSubmitted(false); }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                Abandon attempt
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Tab Switch Indicator */}
      {isActive && !isSubmitted && tabSwitchCount > 0 && (
        <div className={`text-xs font-bold text-center py-1 rounded-lg ${
          tabSwitchCount >= 3 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
        }`}>
          Tab switches detected: {tabSwitchCount}
        </div>
      )}
      {/* Header Bar */}
      <div className="bg-[#141920] border border-slate-800 p-3 lg:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {(isActive || isSubmitted) && (
            <button
              onClick={() => {
                if (isSubmitted) {
                  setIsSubmitted(false);
                  setIsActive(false);
                } else {
                  setIsActive(false);
                }
              }}
              className="mt-0.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer shrink-0"
              title="Back to mocks"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-blue-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Past Exam Papers</span>
            </span>
            <h1 className="text-lg lg:text-base font-semibold text-white mt-1 leading-tight">
              {safeMock.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {`${safeMock.totalQuestions} questions • Strict ${safeMock.durationMinutes}-min timer • Immediate scoring.`}
            </p>
          </div>
        </div>
        {/* Live Timer Gauge */}
        {(isActive || isSubmitted) && (
          <div className="flex items-center gap-3 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-700/80 shadow-inner">
            <div className="text-right min-w-[80px]">
              <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                {isSubmitted ? 'Final Score' : 'Time Remaining'}
              </p>
              <p className={`text-xl font-mono font-semibold ${isSubmitted ? 'text-blue-400' : timeLeftSeconds < 300 ? 'text-rose-400' : 'text-white'}`}>
                {isSubmitted ? `${scorePercent}%` : formatTime(timeLeftSeconds)}
              </p>
            </div>
            {!isSubmitted && (
              <button
                onClick={submitExam}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Submit Now
              </button>
            )}
            {isSubmitted && (
              <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                scorePercent >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                scorePercent >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {scorePercent >= 70 ? 'Great Job!' : scorePercent >= 50 ? 'Keep Going!' : 'Keep Studying!'}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Main Exam Arena Layout */}
      {!isActive && !isSubmitted ? (
        /* Welcome Splash & Selection Sidebar - ONE PAGE FIT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch max-h-[calc(100vh-180px)]">
          {/* LEFT: Rules, instructions and context */}
          <div className="lg:col-span-7 bg-[#141920] border border-slate-800 rounded-xl p-6 sm:p-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                Ready to Begin National Exam Simulation?
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                Mirror the official Ministry of Education digital exam. Test your speed, endurance, and accuracy under real pressure.
              </p>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-blue-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0 border border-blue-500/20">01</span>
                  <span className="leading-relaxed">{`Strict ${safeMock.durationMinutes}-min countdown begins on Start.`}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-blue-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0 border border-blue-500/20">02</span>
                  <span className="leading-relaxed">{`Do not switch tabs or refresh during the drill.`}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-blue-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0 border border-blue-500/20">03</span>
                  <span className="leading-relaxed">{`Instant score calculation with step-by-step solution review.`}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-[#141920] border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-0">
              {/* Simulator Mode Selector */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Exam Mode
                </h3>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('past')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      simulatorMode === 'past'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Past Exams
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('grand')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      simulatorMode === 'grand'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Grand Mock
                  </button>
                </div>
              </div>
              {simulatorMode === 'grand' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      Available National Mocks
                    </label>
                    <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {activeMocks.length} Mocks
                    </span>
                  </div>
                  {/* Selector List */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                    {activeMocks.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No mock exams available for this stream.</p>
                    ) : activeMocks.map((m, idx) => {
                      const isSelected = m.id === selectedMock?.id;
                      const isLocked = !isPremium && idx > 0;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMock(m)}
                          className={`w-full p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex items-start justify-between gap-2 relative overflow-hidden ${
                            isSelected
                              ? 'bg-slate-900 border-blue-500 text-white shadow-sm'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {m.subject}
                              </span>
                              {isLocked && (
                                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> PRO ONLY
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-slate-100 truncate">
                              {m.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {m.durationMinutes} mins
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                {m.totalQuestions} Qs
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-slate-950 self-center">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Subject selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
                      Select Subject
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                      {(stream === 'Natural Science'
                        ? ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'SAT']
                        : ['Economics', 'Geography', 'History', 'Mathematics', 'English', 'SAT']
                      ).map((subject) => {
                        const isSelected = selectedSubject === subject;
                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => setSelectedSubject(subject as Subject)}
                            className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-1 ring-blue-500/30 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <span>{subject}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Available years from past exams in Supabase */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
                      Select Exam Year (E.C.)
                    </label>
                    {availableYears.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">No past exams available for {selectedSubject}.</p>
                    ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                      {availableYears.map((yr) => {
                        const isSelected = selectedYear === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setSelectedYear(yr)}
                            className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-1 ring-blue-500/30 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <span>{yr}</span>
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Launch CTA */}
            <div className="pt-4 border-t border-slate-800/80 mt-auto">
              {(!isPremium && simulatorMode === 'grand' && safeMock.id !== activeMocks[0]?.id) ? (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Locked - Upgrade to Pro</span>
                </button>
              ) : mockQuestions.length === 0 ? (
                <div className="w-full py-3.5 bg-slate-800/60 text-slate-500 font-semibold text-sm rounded-xl border border-slate-700/50 text-center cursor-not-allowed">
                  No questions available for this selection
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Launch Timed Simulation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Active Simulation Screen - DUAL PANEL FOR PC */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-0 max-h-[calc(100vh-140px)]">
          {/* LEFT PANEL (8 cols): Question Viewport */}
          <div className="lg:col-span-8 space-y-3 min-h-0 overflow-hidden flex flex-col">
            {/* Question Card Box */}
            {currentQ && (
              <div className="bg-[#141920] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 relative flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {/* Header within card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-500/10 rounded-lg text-blue-400 text-xs font-bold border border-blue-500/20">
                      {currentQ.subject} • {currentQ.yearEC}
                    </span>
                    {currentQ.chapter && (
                       <span className="text-xs text-slate-500 font-medium">{currentQ.chapter}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSubmitted && (
                      <button
                        onClick={() => toggleFlag(currentQ.id)}
                         className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                          flaggedQuestions[currentQ.id]
                            ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/60 shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                      >
                        <Flag className="w-3 h-3" fill={flaggedQuestions[currentQ.id] ? 'currentColor' : 'none'} />
                        {flaggedQuestions[currentQ.id] ? 'Flagged' : 'Flag'}
                      </button>
                    )}
                    {isSubmitted && flaggedQuestions[currentQ.id] && (
                       <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/60 flex items-center gap-1.5 text-xs font-bold">
                        <Flag className="w-3 h-3" fill="currentColor" />
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
                {/* Question text */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-semibold border border-blue-500/20">
                      {currentIndex + 1}
                    </span>
                     <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      {`of ${mockQuestions.length} Questions`}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed pl-0.5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.questionText) }}
                  />
                </div>
                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map((opt) => {
                    const answered = userAnswers[currentQ.id];
                    const isSelected = answered === opt.id;
                    const isCorrect = opt.id === currentQ.correctOptionId;
                    let style = 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200';
                    if (isSubmitted) {
                      if (isCorrect) {
                        style = 'bg-emerald-500/15 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40';
                      } else if (isSelected) {
                        style = 'bg-rose-500/15 border-rose-500 text-rose-200 line-through';
                      } else {
                        style = 'bg-slate-900/40 border-slate-800 opacity-40';
                      }
                    } else if (isSelected) {
                      style = 'bg-blue-500/15 border-blue-500 text-blue-200 ring-2 ring-blue-500/40 shadow-sm';
                    }
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(currentQ.id, opt.id)}
                        disabled={isSubmitted}
                        className={`p-3.5 lg:p-3 rounded-xl border-2 text-left text-xs font-bold transition-all duration-200 flex items-start space-x-3 cursor-pointer active:scale-[0.98] ${style}`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold uppercase shrink-0 text-xs border ${
                          isSubmitted && isCorrect ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                          isSubmitted && isSelected ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                          isSelected ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                          'bg-slate-700/60 border-slate-600/60 text-slate-300'
                        }`}>
                          {opt.id}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <div className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text) }} />
                        </div>
                        {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 self-center" />}
                        {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 self-center" />}
                      </button>
                    );
                  })}
                </div>
                {/* Navigation Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    Previous
                  </button>
                  {/* Progress indicator */}
                  <div className="hidden sm:flex items-center gap-1.5">
                     <span className="text-xs text-slate-500 font-bold">{currentIndex + 1}/{mockQuestions.length}</span>
                     <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div
                         className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / mockQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  {currentIndex < mockQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : !isSubmitted ? (
                    <button
                      onClick={submitExam}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Submit & Grade
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsActive(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      Back to Mocks
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Post-Submission Explanation Review */}
                {isSubmitted && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5 text-xs leading-snug max-h-[160px] overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between">
                       <span className="font-semibold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Examiner Explanation Review</span>
                      </span>
                      <button
                        onClick={() => onJumpToExplainer(currentQ.questionText, currentQ.subject)}
                         className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 font-semibold rounded-lg flex items-center gap-1.5 text-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ask AI</span>
                      </button>
                    </div>
                    {currentQ.explanation ? (
                      <p className="text-slate-300 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQ.explanation) }} />
                    ) : (
                      <p className="text-slate-500 text-xs italic leading-relaxed">
                        {userAnswers[currentQ.id]
                          ? 'No written explanation for this question.'
                          : 'You skipped this question — the explanation is shown after you attempt it.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* RIGHT PANEL (4 cols): Exam Controller / Status Console */}
          <div className="lg:col-span-4 bg-[#141920] border border-slate-800 rounded-2xl p-3 space-y-2 flex flex-col min-h-0 max-h-[calc(100vh-140px)] overflow-hidden">
            <div className="space-y-2 overflow-y-auto no-scrollbar min-h-0 flex-1">
              {/* Status Header */}
              <div className="border-b border-slate-800/80 pb-2">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                   Exam Control Center
                 </h4>
              </div>
              {/* Progress Summary Stats */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Answered</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {answeredCount}
                    <span className="text-xs text-slate-500 font-normal"> /{mockQuestions.length}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${mockQuestions.length ? (answeredCount / mockQuestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Remaining</div>
                  <div className="text-sm font-semibold text-amber-400 mt-0.5">{unansweredCount}</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${mockQuestions.length ? (unansweredCount / mockQuestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Flagged</div>
                  <div className="text-sm font-semibold text-amber-400 mt-0.5">{Object.values(flaggedQuestions).filter(Boolean).length}</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${mockQuestions.length ? (Object.values(flaggedQuestions).filter(Boolean).length / mockQuestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Grid of question numbers */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Question Navigation Map
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {mockQuestions.map((q, idx) => {
                    const isThisAnswered = !!userAnswers[q.id];
                    const isThisCurrent = idx === currentIndex;
                    const isThisFlagged = flaggedQuestions[q.id];
                    let btnStyle = 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300';
                    if (isSubmitted) {
                      const correct = userAnswers[q.id] === q.correctOptionId;
                      btnStyle = correct
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                    } else if (isThisCurrent) {
                      btnStyle = 'bg-blue-600 text-white border-blue-400 scale-110 shadow-sm';
                    } else if (isThisFlagged) {
                      btnStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
                    } else if (isThisAnswered) {
                      btnStyle = 'bg-slate-800 text-slate-200 border-slate-700';
                    }
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-full aspect-square rounded-lg border text-xs shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer relative font-bold ${btnStyle}`}
                      >
                        {idx + 1}
                        {isThisFlagged && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full border border-[#141920]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Flagged Questions Review or Pro Tip */}
            {isSubmitted ? (
              <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-2.5 space-y-1.5 shrink-0">
                <span className="text-xs font-semibold text-amber-400 uppercase flex items-center gap-1">
                  <Flag className="w-2.5 h-2.5" />
                  Flagged Questions Review
                </span>
                {Object.values(flaggedQuestions).filter(Boolean).length === 0 ? (
                  <p className="text-slate-500 text-xs">No flagged questions.</p>
                ) : (
                  <div className="space-y-0.5 max-h-[100px] overflow-y-auto no-scrollbar">
                    {mockQuestions.map((q, idx) => {
                      if (!flaggedQuestions[q.id]) return null;
                      const correct = userAnswers[q.id] === q.correctOptionId;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className="w-full flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-all cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-amber-400 w-4 text-center shrink-0">{idx + 1}</span>
                          <span className="text-xs text-slate-300 truncate flex-1">{q.questionText.replace(/<[^>]*>/g, '')}</span>
                          {correct
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            : <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-2.5 space-y-1 shrink-0">
                <span className="text-xs font-semibold text-blue-400 uppercase flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Exam Pro Tip
                </span>
                <p className="text-slate-300 text-xs leading-snug">
                  Use the flag button to mark questions you want to revisit before submitting.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
