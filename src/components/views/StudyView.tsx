import { useState, useEffect, useMemo } from 'react';
import { 
  Timer, 
  BookOpen, 
  Bot, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  Target, 
  Clock, 
  Flame,
  Volume2,
  VolumeX,
  Download,
  Printer,
  FileText,
  Check,
  Plus,
  Trash2,
  X,
  Square,
  CheckSquare,
  Grid,
  BarChart2,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { Stream, Language, Subject, SessionHistoryEntry } from '../../types';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import LearningView from './LearningView';
import ExplainerView from './ExplainerView';
import CurriculumMatrixView from './CurriculumMatrixView';
import { db } from '../../lib/supabase';
import Toast from '../../components/Toast';

interface StudyViewProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
  stream: Stream;
  language: Language;
  isPremium: boolean;
  onOpenUpgrade: () => void;
  onJumpToExplainer: (qText: string, subj: any) => void;
  initialNoteId?: string;
  isOfflineMode?: boolean;
  explainerQuery?: string;
  explainerSubj?: Subject;
  onClearExplainerInitial: () => void;
  onCompleteStudy?: (subject: string, chapterName: string, durationMinutes: number) => void;
  sessionHistory?: SessionHistoryEntry[];
  showToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function StudyView({
  activeSubTab,
  onSubTabChange,
  stream,
  language,
  isPremium,
  onOpenUpgrade,
  onJumpToExplainer,
  initialNoteId,
  isOfflineMode,
  explainerQuery,
  explainerSubj,
  onClearExplainerInitial,
  onCompleteStudy,
  sessionHistory = [],
  showToast: globalShowToast
}: StudyViewProps) {
  

  // --- STUDY TIMER (POMODORO) STATE ---
  const [focusMode, setFocusMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState<number>(1500); // 25 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedPomodorosToday, setCompletedPomodorosToday] = useState<number>(3);
  const [totalFocusSecondsToday, setTotalFocusSecondsToday] = useState<number>(8100); // 2h 15m
  const [selectedGrade, setSelectedGrade] = useState<number>(12);
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [secondsStudiedInSession, setSecondsStudiedInSession] = useState<number>(0);
  const [studyGoal, setStudyGoal] = useState<string>('Master Chapter 3 Formulas & Past Questions');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // --- STUDY SESSION TARGET TASK CHECKLIST ---
  const [pomodoroTasks, setPomodoroTasks] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: '1', text: 'Review Chapter 3 Formulas', completed: false },
    { id: '2', text: 'Solve 3 previous matric questions', completed: false },
    { id: '3', text: 'Summarize core unit definitions', completed: false }
  ]);
  const [newTaskText, setNewTaskText] = useState<string>('');

  // --- FLOATING NOTIFICATION SYSTEM (TOAST) ---
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = globalShowToast || ((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 3500);
  });

  // --- CURRICULUM DEEP LINK & MATRIX STATE ---
  const [deepLinkChapter, setDeepLinkChapter] = useState<{ grade: number; subject: string; chapterNumber: number } | null>(null);

  const [studiedChapters, setStudiedChapters] = useState<string[]>(['12-Physics-1']);

  useEffect(() => {
    db.getStudiedChapters().then(setStudiedChapters).catch(() => {});
  }, [activeSubTab]);

  const subjectsList = useMemo(() => {
    return stream === 'Natural Science' 
      ? ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'SAT']
      : ['History', 'Geography', 'Economics', 'Mathematics', 'English', 'SAT'];
  }, [stream]);

  // --- PRO ANALYTICS FILTER STATE ---
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'study' | 'practice' | 'simulation'>('all');

  // --- ANALYTICS CALCULATIONS ---
  const totalChaptersInSyllabus = useMemo(() => {
    const curStreamKey = stream === 'Natural Science' ? 'Natural' : 'Social';
    const streamData = ETHIOPIAN_CURRICULUM.find(s => s.stream === curStreamKey);
    if (!streamData) return 0;
    return streamData.subjects.reduce((sum, sub) => sum + sub.chapters.length, 0);
  }, [stream]);

  const analyticsData = useMemo(() => {
    const studyEntries = sessionHistory.filter(h => h.type === 'study');
    const practiceEntries = sessionHistory.filter(h => h.type === 'practice');
    const simulationEntries = sessionHistory.filter(h => h.type === 'simulation');

    const totalStudyMins = studyEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalPracticeMins = practiceEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalSimMins = simulationEntries.reduce((acc, h) => acc + h.durationMinutes, 0);
    const totalMinsCombined = totalStudyMins + totalPracticeMins + totalSimMins;

    // subject breakdown minutes
    const subjectMins: Record<string, number> = {};
    sessionHistory.forEach(h => {
      const subj = h.subject || 'Other';
      subjectMins[subj] = (subjectMins[subj] || 0) + h.durationMinutes;
    });

    // Sort subjects by study duration
    const sortedSubjects = Object.entries(subjectMins).map(([subject, minutes]) => ({
      subject,
      minutes
    })).sort((a, b) => b.minutes - a.minutes);

    // Calculate dynamic advice based on studied subject ratios
    let balanceAdvice = "You're showing consistent study patterns! Consider reviewing multiple subjects daily to keep your memory retrieval fresh.";
    if (sortedSubjects.length > 0) {
      const topSubj = sortedSubjects[0].subject;
      const otherSubjectsInStream = subjectsList.filter(s => s !== topSubj);
      if (otherSubjectsInStream.length > 0) {
        const recommendedSubj = otherSubjectsInStream[Math.floor(Math.random() * otherSubjectsInStream.length)];
        balanceAdvice = `You've spent the most focus time on ${topSubj} (${sortedSubjects[0].minutes} mins). To maintain a balanced study index and prevent curriculum drift, schedule your next 25-minute Pomodoro focus block on ${recommendedSubj}!`;
      }
    }

    return {
      totalStudyMins,
      totalPracticeMins,
      totalSimMins,
      totalMinsCombined,
      sortedSubjects,
      balanceAdvice,
      totalSessionsCount: sessionHistory.length,
      studySessionsCount: studyEntries.length,
      practiceSessionsCount: practiceEntries.length,
      simulationSessionsCount: simulationEntries.length
    };
  }, [sessionHistory, subjectsList]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalHoursMinutes = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${secs}s`;
  };

  const chaptersList = useMemo(() => {
    const curStreamKey = stream === 'Natural Science' ? 'Natural' : 'Social';
    const streamData = ETHIOPIAN_CURRICULUM.find(s => s.stream === curStreamKey);
    if (!streamData) return [];
    
    let searchSubject = selectedSubject;
    if (searchSubject === 'Mathematics') searchSubject = 'Maths';
    
    const subjectData = streamData.subjects.find(
      sub => sub.subject.toLowerCase() === searchSubject.toLowerCase() && sub.grade === selectedGrade
    );
    return subjectData ? subjectData.chapters : [];
  }, [stream, selectedSubject, selectedGrade]);

  useEffect(() => {
    if (chaptersList.length > 0) {
      setSelectedChapter(chaptersList[0]);
    } else {
      setSelectedChapter(null);
    }
  }, [chaptersList]);

  const switchTimerMode = (mode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setIsTimerRunning(false);
    setFocusMode(mode);
    if (mode === 'pomodoro') setTimeRemaining(1500);
    if (mode === 'shortBreak') setTimeRemaining(300);
    if (mode === 'longBreak') setTimeRemaining(900);
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
        if (focusMode === 'pomodoro') {
          setTotalFocusSecondsToday(prev => prev + 1);
          setSecondsStudiedInSession(prev => prev + 1);
        }
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (focusMode === 'pomodoro') {
        setCompletedPomodorosToday(prev => prev + 1);
        
        // Log to curriculum
        const minutesStudied = Math.max(1, Math.round(secondsStudiedInSession / 60)) || 25;
        const chapterLabel = selectedChapter ? `Unit ${selectedChapter.chapterNumber}: ${selectedChapter.chapterName}` : 'General Review';
        if (onCompleteStudy) {
          onCompleteStudy(selectedSubject, chapterLabel, minutesStudied);
        }
        
        // Mark chapter as studied
        if (selectedChapter) {
          const chapterKey = `${selectedGrade}-${selectedSubject}-${selectedChapter.chapterNumber}`;
          db.toggleStudiedChapter(chapterKey).then(setStudiedChapters);
        }
        
        setSecondsStudiedInSession(0);
        showToast('🎉 Study Block Completed & Logged to Curriculum! Take a 5-minute break.', 'success');
        switchTimerMode('shortBreak');
      } else {
        showToast("💪 Break is over! Let's get back to active focus.", 'success');
        switchTimerMode('pomodoro');
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, focusMode, selectedSubject, selectedChapter, selectedGrade, secondsStudiedInSession, studiedChapters]);

  const subTabs = [
    { id: 'learning', label: 'Study Notes', icon: <BookOpen className="w-4 h-4 text-indigo-400" /> },
    { id: 'curriculum-grid', label: 'Syllabus Map', icon: <Grid className="w-4 h-4 text-rose-400" /> },
    { id: 'explainer', label: 'AI Tutor', icon: <Bot className="w-4 h-4 text-emerald-400" /> },
  ];

  const dailyGoalSeconds = 14400; // 4 hours
  const progressPercent = Math.min(100, Math.round((totalFocusSecondsToday / dailyGoalSeconds) * 100));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. HERO HEADER & HUB BANNER */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-3 sm:py-2.5 sm:px-4 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 rounded-lg text-teal-400 shadow-inner shrink-0 hidden sm:block">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md text-[8px] font-extrabold uppercase tracking-wider text-teal-300">
                  {stream} Stream
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">
                Study Hub
              </h1>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. SUB-NAVIGATION TAB SWITCHER */}
      <div className="flex bg-[#131E32] p-1.5 rounded-2xl border border-slate-800/80 shadow-md overflow-x-auto">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              className={`flex-1 min-w-[130px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-white border border-teal-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SUB-TAB CONTENT ARENA */}
      <div className="min-h-[500px]">
        
        {/* --- TAB 1: STUDY TIMER (POMODORO FOCUS SUITE) --- */}
        {activeSubTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Timer Gauge (8 Columns) */}
            <div className="lg:col-span-8 bg-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                        <span>{'Pomodoro Focus Session'}</span>
                        {selectedChapter && (
                          <span className="px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black rounded-md">
                            G{selectedGrade} • {selectedSubject} Unit {selectedChapter.chapterNumber}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedChapter 
                          ? `Studying: Unit ${selectedChapter.chapterNumber} - ${selectedChapter.chapterName}`
                          : '25 mins deep work • 5 mins break • Build exam stamina'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      showToast(
                        soundEnabled 
                          ? '🔇 Focus sound alerts disabled'
                          : '🔊 Focus sound alerts enabled',
                        'info'
                      );
                    }}
                    className="p-2 bg-[#0F172A] hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
                    title={soundEnabled ? "Mute audio cues" : "Enable audio cues"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>

                {/* Mode Selectors */}
                <div className="flex justify-center mt-8">
                  <div className="flex p-1 bg-[#0F172A] rounded-2xl border border-slate-800">
                    <button
                      onClick={() => {
                        switchTimerMode('pomodoro');
                        showToast('⏳ 25-minute Pomodoro focus mode selected', 'info');
                      }}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        focusMode === 'pomodoro'
                          ? 'bg-teal-500 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {'Focus (25m)'}
                    </button>
                    <button
                      onClick={() => {
                        switchTimerMode('shortBreak');
                        showToast('☕ 5-minute short break selected', 'info');
                      }}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        focusMode === 'shortBreak'
                          ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {'Break (5m)'}
                    </button>
                    <button
                      onClick={() => {
                        switchTimerMode('longBreak');
                        showToast('🌴 15-minute long break selected', 'info');
                      }}
                      className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        focusMode === 'longBreak'
                          ? 'bg-indigo-400 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {'Rest (15m)'}
                    </button>
                  </div>
                </div>

                {/* SVG Circular Countdown and Huge Time Display */}
                <div className="flex flex-col items-center justify-center my-10 relative">
                  <div className="relative w-60 h-60 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="120"
                        cy="120"
                        r="90"
                        className="stroke-slate-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Foreground progress circle */}
                      <circle
                        cx="120"
                        cy="120"
                        r="90"
                        className={`transition-all duration-300 ease-out ${
                          focusMode === 'pomodoro' 
                            ? 'stroke-teal-400' 
                            : focusMode === 'shortBreak' 
                              ? 'stroke-amber-400' 
                              : 'stroke-indigo-400'
                        }`}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 90}
                        strokeDashoffset={
                          2 * Math.PI * 90 - 
                          (timeRemaining / (focusMode === 'pomodoro' ? 1500 : focusMode === 'shortBreak' ? 300 : 900)) * 2 * Math.PI * 90
                        }
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    
                    {/* Centered text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-4xl sm:text-5xl font-mono font-black text-white select-none tracking-tighter drop-shadow-md">
                        {formatTime(timeRemaining)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                        focusMode === 'pomodoro' 
                          ? 'text-teal-400' 
                          : focusMode === 'shortBreak' 
                            ? 'text-amber-400' 
                            : 'text-indigo-400'
                      }`}>
                        {focusMode === 'pomodoro' ? 'Focus' : 'Break'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-center space-x-2 text-xs font-semibold">
                    <span className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <span className={isTimerRunning ? 'text-emerald-400' : 'text-slate-400'}>
                      {isTimerRunning 
                        ? (focusMode === 'pomodoro' ? '🔥 Deep Focus Session Active...' : '☕ Recharging Break Active...')
                        : 'Ready to Start Session'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Play/Pause Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-slate-800/80">
                {!isTimerRunning ? (
                  <button
                    onClick={() => {
                      setIsTimerRunning(true);
                      showToast('▶️ Focus timer started! Dive deep!', 'success');
                    }}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{'Start Focus Timer'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      showToast('⏸️ Focus timer paused', 'warning');
                    }}
                    className="w-full sm:w-auto px-10 py-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-black text-sm rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                    <span>{'Pause Timer'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const elapsed = secondsStudiedInSession;
                    switchTimerMode(focusMode);
                    setSecondsStudiedInSession(0);
                    showToast('🔄 Timer reset successfully', 'info');
                  }}
                  className="w-full sm:w-auto px-6 py-4 bg-[#0F172A] hover:bg-slate-800 text-slate-300 font-bold text-sm rounded-2xl border border-slate-800 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  title="Reset countdown"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{'Reset'}</span>
                </button>

                {secondsStudiedInSession >= 10 && (
                  <button
                    onClick={() => {
                      const mins = Math.max(1, Math.round(secondsStudiedInSession / 60));
                      const chapterLabel = selectedChapter ? `Unit ${selectedChapter.chapterNumber}: ${selectedChapter.chapterName}` : 'General Review';
                      if (onCompleteStudy) {
                        onCompleteStudy(selectedSubject, chapterLabel, mins);
                      }
                      
                      if (selectedChapter) {
                        const chapterKey = `${selectedGrade}-${selectedSubject}-${selectedChapter.chapterNumber}`;
                        db.toggleStudiedChapter(chapterKey).then(setStudiedChapters);
                      }
                      
                      setIsTimerRunning(false);
                      setSecondsStudiedInSession(0);
                      setTimeRemaining(1500); // Reset countdown
                      showToast(`📊 Successfully logged ${mins}m study to curriculum!`, 'success');
                    }}
                    className="w-full sm:w-auto px-6 py-4 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold text-sm rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 animate-fadeIn"
                    title="Log current focus time"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Log {Math.max(1, Math.round(secondsStudiedInSession / 60))}m</span>
                  </button>
                )}
              </div>

            </div>

            {/* Side Configuration & Goal Planner (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Pro Curriculum-Aligned Study Target Selector */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-white font-bold text-sm">
                    <Target className="w-4 h-4 text-teal-400" />
                    <span>{'Curriculum Focus Target'}</span>
                  </div>
                  <span className="text-[9px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-extrabold uppercase px-1.5 py-0.5 rounded-md">
                    Pro Linked
                  </span>
                </div>

                {/* Grade Segmented Control */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{'Target Grade'}</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#0F172A] border border-slate-800 rounded-xl">
                    {[9, 10, 11, 12].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                          selectedGrade === g
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        G{g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{'Subject'}</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    {subjectsList.map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                {/* Chapter Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{'Curriculum Unit'}</label>
                  {chaptersList.length > 0 ? (
                    <select
                      value={selectedChapter ? JSON.stringify(selectedChapter) : ''}
                      onChange={(e) => {
                        try {
                          setSelectedChapter(JSON.parse(e.target.value));
                        } catch (err) {}
                      }}
                      className="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      {chaptersList.map((ch) => (
                        <option key={ch.chapterNumber} value={JSON.stringify(ch)}>
                          Unit {ch.chapterNumber}: {ch.chapterName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl text-xs text-slate-500 italic">
                      No units found for G{selectedGrade} {selectedSubject}
                    </div>
                  )}
                </div>
              </div>



              {/* Quick Daily Progress Summary */}
              <div className="bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/20 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{'Daily 4-Hour Focus Target'}</span>
                  <span className="text-teal-400 font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{completedPomodorosToday} {'Pomodoros done'}</span>
                  <button 
                    onClick={() => onSubTabChange('learning')}
                    className="text-teal-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{'Open Curriculum'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 2: CURRICULUM (SYLLABUS MAP) --- */}
        {activeSubTab === 'learning' && (
          <div className="pt-2">
            <LearningView
              stream={stream}
              language={language}
              isPremium={isPremium}
              onOpenUpgrade={onOpenUpgrade}
              onJumpToExplainer={onJumpToExplainer}
              initialNoteId={initialNoteId}
              isOfflineMode={isOfflineMode}
              onCompleteStudy={onCompleteStudy}
              initialGrade={deepLinkChapter?.grade}
              initialSubject={deepLinkChapter?.subject}
              initialChapterNum={deepLinkChapter?.chapterNumber}
              onClearDeepLink={() => setDeepLinkChapter(null)}
            />
          </div>
        )}

        {/* --- TAB 3: AI TUTOR (EXPLAINER) --- */}
        {activeSubTab === 'explainer' && (
          <div className="pt-2">
            <ExplainerView
              language={language}
              initialQuery={explainerQuery}
              initialSubject={explainerSubj}
              onClearInitial={onClearExplainerInitial}
            />
          </div>
        )}

        {/* --- NEW TAB: PRO STUDY ANALYTICS (DEEP INTEL & CURRICULUM SYNC) --- */}
        {false && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Description */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                    Pro Scholar Mode
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time Curriculum Sync</span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  {'Pro Student Analytics & Deep Study Insights'}
                </h2>
                <p className="text-xs text-slate-400">
                  {'Monitor syllabus coverage, focus balance, and historical session logs in one place.'}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2 bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-black text-slate-300 font-mono">DATABASE SYNCED</span>
              </div>
            </div>

            {/* Grid 1: Hero Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Mins */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {'Total Focused Study'}
                  </p>
                  <p className="text-xl font-mono font-black text-white mt-1">
                    {analyticsData.totalMinsCombined} <span className="text-xs font-sans text-slate-400 font-normal">mins</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Curriculum Coverage */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {'Curriculum Coverage'}
                  </p>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <p className="text-xl font-mono font-black text-white">
                      {studiedChapters.length}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">/ {totalChaptersInSyllabus} units</span>
                    <span className="text-xs text-indigo-400 font-black ml-auto font-mono">
                      {Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0F172A] h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800/80">
                    <div 
                      className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Completed Pomodoros today */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {'Completed Sessions'}
                  </p>
                  <p className="text-xl font-mono font-black text-white mt-1">
                    {analyticsData.totalSessionsCount} <span className="text-xs font-sans text-slate-400 font-normal">registered</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Total XP */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Award className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {'Academic Power XP'}
                  </p>
                  <p className="text-xl font-mono font-black text-amber-300 mt-1">
                    +{(analyticsData.studySessionsCount * 50) + (analyticsData.practiceSessionsCount * 40) + (analyticsData.simulationSessionsCount * 120)} <span className="text-xs font-sans text-slate-400 font-normal">XP</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Grid 2: Distribution & Balance Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Focus Distribution Chart (7 Columns) */}
              <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4 text-teal-400" />
                      <h3 className="font-bold text-sm text-white">{'Focus Weight per Subject'}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Interactive Meter</span>
                  </div>

                  {analyticsData.sortedSubjects.length > 0 ? (
                    <div className="space-y-4 pt-2">
                      {analyticsData.sortedSubjects.map(({ subject, minutes }) => {
                        const maxMins = Math.max(...analyticsData.sortedSubjects.map(s => s.minutes)) || 1;
                        const pctOfMax = Math.round((minutes / maxMins) * 100);
                        return (
                          <div key={subject} className="space-y-1.5 group">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors">{subject}</span>
                              <span className="font-mono text-slate-400 font-bold">
                                {minutes} {'mins'}
                              </span>
                            </div>
                            <div className="w-full bg-[#0F172A] h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div 
                                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                                style={{ width: `${pctOfMax}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-[#0F172A]/40 border border-slate-800/80 border-dashed rounded-2xl">
                      <p className="text-xs text-slate-500 italic">No study logs detected yet. Start the floating study timer to begin gathering analytics!</p>
                      <button 
                        onClick={() => showToast('Use the floating timer button in the bottom-right corner!', 'info')}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer"
                      >
                        Start Timer Session
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-slate-900/60 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs text-slate-400">
                  <span>Want to balance subjects? Use our AI Advisor.</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Right Side: Smart Study Balance advice & Quick link */}
              <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm pb-4 border-b border-slate-800/80">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>AI Study Balance Adviser</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {analyticsData.balanceAdvice}
                  </p>

                  <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-3">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Balanced Syllabus Check</h4>
                    <p className="text-[11px] text-slate-500">
                      National matric success relies on comprehensive subject knowledge. Concentrating focus too heavily on one area leaves critical scores vulnerable. Keep all subjects above 20 mins!
                    </p>
                  </div>
                </div>

                {analyticsData.sortedSubjects.length > 0 && (
                  <button
                    onClick={() => {
                      // Recommend target subject
                      const topSubj = analyticsData.sortedSubjects[0].subject;
                      const recommendations = subjectsList.filter(s => s !== topSubj);
                      if (recommendations.length > 0) {
                        const target = recommendations[Math.floor(Math.random() * recommendations.length)];
                        setSelectedSubject(target);
                        showToast(`🎯 Focus target automatically set to ${target}! Use the floating timer to start.`, 'info');
                      }
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all text-center cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>🎯 Apply Recommended Balance & Study</span>
                  </button>
                )}
              </div>

            </div>

            {/* Performance History Logs Table */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Chronological Scholar Session Logs</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Filters allow deep examination of logged focus intervals, practices, and full mocks.</p>
                </div>

                {/* Log filters */}
                <div className="flex items-center gap-1.5 p-1 bg-[#0F172A] border border-slate-800 rounded-xl overflow-x-auto self-start sm:self-auto max-w-full">
                  {(['all', 'study', 'practice', 'simulation'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAnalyticsFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        analyticsFilter === filter
                          ? 'bg-slate-800 text-teal-300 border border-teal-500/20'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* List table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs font-sans text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] pb-3">
                      <th className="pb-3 px-3">Subject & Unit/Activity</th>
                      <th className="pb-3 px-3">Session Type</th>
                      <th className="pb-3 px-3 text-center">Duration</th>
                      <th className="pb-3 px-3">Completion Date</th>
                      <th className="pb-3 px-3 text-right">Power Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory
                      .filter(h => analyticsFilter === 'all' || h.type === analyticsFilter)
                      .map((h) => {
                        const isStudy = h.type === 'study';
                        const isPrac = h.type === 'practice';
                        const xpValue = isStudy ? 50 : isPrac ? 40 : 120;
                        return (
                          <tr key={h.id} className="border-b border-slate-800/60 hover:bg-[#0F172A]/40 transition-all font-medium">
                            <td className="py-3 px-3">
                              <p className="text-white font-bold">{h.subject}</p>
                              {h.chapter && <p className="text-[10px] text-slate-500 mt-0.5">{h.chapter}</p>}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                isStudy
                                  ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
                                  : isPrac
                                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                              }`}>
                                {h.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-white font-bold">
                              {h.durationMinutes}m
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                              {h.date}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-300 font-mono font-extrabold">
                              +{xpValue} XP
                            </td>
                          </tr>
                        );
                      })}

                    {sessionHistory.filter(h => analyticsFilter === 'all' || h.type === analyticsFilter).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500 italic">
                          No session entries found matching selected category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 4: CURRICULUM GRID --- */}
        {activeSubTab === 'curriculum-grid' && (
          <div className="pt-2 animate-fadeIn text-slate-100">
            <CurriculumMatrixView
              language={language}
              stream={stream}
              studiedChapters={studiedChapters}
              onSelectChapter={(grade, subject, chapterNumber) => {
                setDeepLinkChapter({ grade, subject, chapterNumber });
                onSubTabChange('learning');
              }}
              isOfflineMode={isOfflineMode}
            />
          </div>
        )}

      </div>

      {/* Local toast fallback (only when no global toast provided) */}
      {!globalShowToast && localToast && (
        <Toast toast={localToast} onDismiss={() => setLocalToast(null)} />
      )}
    </div>
  );
}
