
import { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Award, RotateCcw, ArrowRight, Lock, Sparkles, BookOpen, Check, Play, HelpCircle, FileText, ChevronRight, Flag } from 'lucide-react';
import { Stream, Language, MockExam, Subject, PracticeQuestion } from '../../types';
import { db } from '../../lib/supabase';
import confetti from 'canvas-confetti';

function generatePastPaperQuestions(_subject: Subject, _year: number, _stream: Stream): PracticeQuestion[] { return []; }

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
      correctOptionId: ['a','b','c','d'][q.correctIndex] || 'a',
      explanation: q.explanation || '',
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
  const submitExam = () => {
    setIsActive(false);
    setIsSubmitted(true);
    let correct = 0;
    const answers = userAnswersRef.current;
    mockQuestions.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        correct += 1;
      }
    });
    const pct = Math.round((correct / (mockQuestions.length || 1)) * 100);
    setScorePercent(pct);
    onCompleteMock(safeMock.id, pct);
    if (pct >= 60) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };
  submitExamRef.current = submitExam;
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = mockQuestions.length - answeredCount;
  return (
    <div className="w-full max-w-7xl mx-auto py-1.5 lg:py-1 px-3 sm:px-4 font-sans select-none space-y-3 lg:space-y-2 animate-fadeIn text-slate-100">
      {/* Proctor Warning Modal */}
      {showProctorWarning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border border-rose-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-black text-white">Exam Integrity Warning</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              You have switched tabs <span className="text-amber-400 font-black">{tabSwitchCount} times</span> during this exam.
              Continued tab switching may result in your exam being flagged.
            </p>
            <p className="text-xs text-slate-500">
              This exam monitors tab focus to ensure fair testing conditions.
            </p>
            <button
              onClick={() => setShowProctorWarning(false)}
              className="px-8 py-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black rounded-xl hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
      {/* Tab Switch Indicator */}
      {isActive && !isSubmitted && tabSwitchCount > 0 && (
        <div className={`text-[10px] font-bold text-center py-1 rounded-lg ${
          tabSwitchCount >= 3 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
        }`}>
          Tab switches detected: {tabSwitchCount}
        </div>
      )}
      {/* Header Bar */}
      <div className="bg-[#1E293B] border border-slate-800 p-3 lg:p-4 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
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
              className="mt-0.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
              title="Back to mocks"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{'Past Exam Papers'}</span>
            </span>
            <h1 className="text-lg lg:text-base font-black text-white mt-1 leading-tight">
              {safeMock.title}
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {`${safeMock.totalQuestions} questions • Strict ${safeMock.durationMinutes}-min timer • Immediate scoring.`}
            </p>
          </div>
        </div>
        {/* Live Timer Gauge */}
        {(isActive || isSubmitted) && (
          <div className="flex items-center gap-3 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-700/80 shadow-inner">
            <div className="text-right min-w-[80px]">
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">
                {isSubmitted ? 'Final Score' : 'Time Remaining'}
              </p>
              <p className={`text-xl font-mono font-black ${isSubmitted ? 'text-teal-400' : timeLeftSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                {isSubmitted ? `${scorePercent}%` : formatTime(timeLeftSeconds)}
              </p>
            </div>
            {!isSubmitted && (
              <button
                onClick={submitExam}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer active:scale-95"
              >
                {'Submit Now'}
              </button>
            )}
            {isSubmitted && (
              <div className={`px-4 py-2 rounded-xl font-black text-sm ${
                scorePercent >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                scorePercent >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {scorePercent >= 70 ? '🎉 Great Job!' : scorePercent >= 50 ? '👍 Keep Going!' : '📚 Keep Studying!'}
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
          <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-56 h-56 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {'Ready to Begin National Exam Simulation?'}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                {'Mirror the official Ministry of Education digital exam. Test your speed, endurance, and accuracy under real pressure.'}
              </p>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-teal-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 font-black text-xs shrink-0 border border-teal-500/20">01</span>
                  <span className="leading-relaxed">{`Strict ${safeMock.durationMinutes}-min countdown begins on Start.`}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-teal-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 font-black text-xs shrink-0 border border-teal-500/20">02</span>
                  <span className="leading-relaxed">{`Do not switch tabs or refresh during the drill.`}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 hover:border-teal-500/20 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-400 font-black text-xs shrink-0 border border-teal-500/20">03</span>
                  <span className="leading-relaxed">{`Immediate AI grading with step-by-step review at submission.`}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-0">
              {/* Simulator Mode Selector */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {'Exam Mode'}
                </h3>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('past')}
                    className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      simulatorMode === 'past'
                        ? 'bg-teal-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {'Past Exams'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatorMode('grand')}
                    className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      simulatorMode === 'grand'
                        ? 'bg-teal-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {'Grand Mock'}
                  </button>
                </div>
              </div>
              {simulatorMode === 'grand' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {'Available National Mocks'}
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {activeMocks.length} {'Mocks'}
                    </span>
                  </div>
                  {/* Selector List */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                    {activeMocks.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-4">No mock exams available for this stream.</p>
                    ) : activeMocks.map((m, idx) => {
                      const isSelected = m.id === selectedMock?.id;
                      const isLocked = !isPremium && idx > 0;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMock(m)}
                          className={`w-full p-3 rounded-xl text-left border-2 transition-all cursor-pointer flex items-start justify-between gap-2 relative overflow-hidden ${
                            isSelected
                              ? 'bg-slate-900 border-teal-500 text-white shadow-lg shadow-teal-500/5'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                {m.subject}
                              </span>
                              {isLocked && (
                                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
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
                            <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 self-center">
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      {'Select Subject'}
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
                            className={`py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-400 text-teal-300 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10'
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      {'Select Exam Year (E.C.)'}
                    </label>
                    {availableYears.length === 0 ? (
                      <p className="text-[10px] text-slate-500 py-2">No past exams available for {selectedSubject}.</p>
                    ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                      {availableYears.map((yr) => {
                        const isSelected = selectedYear === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setSelectedYear(yr)}
                            className={`py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-400 text-teal-300 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/10'
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
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  <span>{'Locked - Upgrade to Pro'}</span>
                </button>
              ) : mockQuestions.length === 0 ? (
                <div className="w-full py-3.5 bg-slate-800/60 text-slate-500 font-black text-sm rounded-xl border border-slate-700/50 text-center cursor-not-allowed">
                  No questions available for this selection
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{'Launch Timed Simulation'}</span>
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
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 relative flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {/* Header within card */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-teal-500/10 rounded-lg text-teal-400 text-[10px] font-bold border border-teal-500/20">
                      {currentQ.subject} • {currentQ.yearEC}
                    </span>
                    {currentQ.chapter && (
                      <span className="text-[10px] text-slate-500 font-medium">{currentQ.chapter}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isSubmitted && (
                      <button
                        onClick={() => toggleFlag(currentQ.id)}
                        className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold ${
                          flaggedQuestions[currentQ.id]
                            ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                      >
                        <Flag className="w-3 h-3" fill={flaggedQuestions[currentQ.id] ? 'currentColor' : 'none'} />
                        {flaggedQuestions[currentQ.id] ? 'Flagged' : 'Flag'}
                      </button>
                    )}
                    {isSubmitted && flaggedQuestions[currentQ.id] && (
                      <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/60 flex items-center gap-1.5 text-[10px] font-bold">
                        <Flag className="w-3 h-3" fill="currentColor" />
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
                {/* Question text */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 text-[10px] font-black border border-teal-500/20">
                      {currentIndex + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {`of ${mockQuestions.length} Questions`}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-relaxed pl-0.5"
                    dangerouslySetInnerHTML={{ __html: currentQ.questionText }}
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
                      style = 'bg-teal-500/15 border-teal-500 text-teal-200 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/10';
                    }
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(currentQ.id, opt.id)}
                        disabled={isSubmitted}
                        className={`p-3.5 lg:p-3 rounded-xl border-2 text-left text-[11px] font-bold transition-all duration-200 flex items-start space-x-3 cursor-pointer active:scale-[0.98] ${style}`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black uppercase shrink-0 text-xs border ${
                          isSubmitted && isCorrect ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' :
                          isSubmitted && isSelected ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                          isSelected ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' :
                          'bg-slate-700/60 border-slate-600/60 text-slate-300'
                        }`}>
                          {opt.id}
                        </span>
                        <div className="flex-1 pt-0.5">
                          <div className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: opt.text }} />
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
                    className="px-4 py-2 rounded-xl text-[11px] font-bold text-slate-300 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    {'Previous'}
                  </button>
                  {/* Progress indicator */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">{currentIndex + 1}/{mockQuestions.length}</span>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / mockQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  {currentIndex < mockQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black text-[11px] rounded-xl shadow-lg shadow-teal-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      {'Next'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : !isSubmitted ? (
                    <button
                      onClick={submitExam}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[11px] rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {'Submit & Grade'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsActive(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-[11px] font-bold hover:bg-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      {'Back to Mocks'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Post-Submission Explanation Review */}
                {isSubmitted && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2.5 text-[10px] leading-snug animate-fadeIn max-h-[160px] overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-teal-400 flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{'Examiner Explanation Review'}</span>
                      </span>
                      <button
                        onClick={() => onJumpToExplainer(currentQ.questionText, currentQ.subject)}
                        className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 font-black rounded-lg flex items-center gap-1.5 text-[11px] cursor-pointer transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{'Ask AI'}</span>
                      </button>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
                  </div>
                )}
              </div>
            )}
          </div>
          {/* RIGHT PANEL (4 cols): Exam Controller / Status Console */}
          <div className="lg:col-span-4 bg-[#1E293B] border border-slate-800 rounded-2xl p-3 space-y-2 shadow-2xl flex flex-col min-h-0 max-h-[calc(100vh-140px)] overflow-hidden">
            <div className="space-y-2 overflow-y-auto no-scrollbar min-h-0 flex-1">
              {/* Status Header */}
              <div className="border-b border-slate-800/80 pb-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {'Exam Control Center'}
                </h4>
              </div>
              {/* Progress Summary Stats */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-[8px] text-slate-400 uppercase font-black tracking-wide">{'Answered'}</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {answeredCount}
                    <span className="text-[9px] text-slate-500 font-normal"> /{mockQuestions.length}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${mockQuestions.length ? (answeredCount / mockQuestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-[8px] text-slate-400 uppercase font-black tracking-wide">{'Remaining'}</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">{unansweredCount}</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${mockQuestions.length ? (unansweredCount / mockQuestions.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-[8px] text-slate-400 uppercase font-black tracking-wide">{'Flagged'}</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">{Object.values(flaggedQuestions).filter(Boolean).length}</div>
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
                <label className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">
                  {'Question Navigation Map'}
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
                      btnStyle = 'bg-teal-500 text-slate-950 border-teal-400 scale-110 shadow-md shadow-teal-500/20';
                    } else if (isThisFlagged) {
                      btnStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
                    } else if (isThisAnswered) {
                      btnStyle = 'bg-slate-800 text-slate-200 border-slate-700';
                    }
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-full aspect-square rounded-lg border text-[9px] shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer relative font-bold ${btnStyle}`}
                      >
                        {idx + 1}
                        {isThisFlagged && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full border border-[#1E293B]" />
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
                <span className="text-[8px] font-black text-amber-400 uppercase flex items-center gap-1">
                  <Flag className="w-2.5 h-2.5" />
                  {'Flagged Questions Review'}
                </span>
                {Object.values(flaggedQuestions).filter(Boolean).length === 0 ? (
                  <p className="text-slate-500 text-[9px]">{'No flagged questions.'}</p>
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
                          <span className="text-[9px] font-black text-amber-400 w-4 text-center shrink-0">{idx + 1}</span>
                          <span className="text-[8px] text-slate-300 truncate flex-1">{q.questionText.replace(/<[^>]*>/g, '')}</span>
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
              <div className="bg-slate-900/60 border border-teal-500/20 rounded-xl p-2.5 space-y-1 shrink-0">
                <span className="text-[8px] font-black text-teal-400 uppercase flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {'Exam Pro Tip'}
                </span>
                <p className="text-slate-300 text-[9px] leading-snug">
                  {'Use the flag button to mark questions you want to revisit before submitting.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
