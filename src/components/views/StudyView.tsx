import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Bot, 
  Sparkles, 
  GraduationCap, 
  Clock, 
  Flame,
  Grid,
  BarChart2,
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

  const subTabs = [
    { id: 'learning', label: 'Notes', fullLabel: 'Study Notes', icon: <BookOpen className="w-4 h-4 text-indigo-400" /> },
    { id: 'curriculum-grid', label: 'Syllabus', fullLabel: 'Syllabus Map', icon: <Grid className="w-4 h-4 text-rose-400" /> },
    { id: 'explainer', label: 'AI Tutor', fullLabel: 'AI Tutor', icon: <Bot className="w-4 h-4 text-emerald-400" /> },
    { id: 'analytics', label: 'Analytics', fullLabel: 'Pro Analytics', icon: <BarChart2 className="w-4 h-4 text-amber-400" /> },
  ];


  return (
          <div className="space-y-6">
      
      {/* 1. HERO HEADER & HUB BANNER */}
      <div className="bg-[#141920] border border-slate-800 rounded-xl p-3 sm:py-2.5 sm:px-4 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800/50 border border-white/10 rounded-lg text-blue-400 shadow-inner shrink-0 hidden sm:block">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs font-semibold uppercase tracking-wider text-blue-300">
                  {stream} Stream
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-tight">
                Study Hub
              </h1>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. SUB-NAVIGATION TAB SWITCHER */}
      <div className="flex bg-[#0F1218] p-1 rounded-xl border border-slate-800/80 shadow-md">
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-white/10 text-white border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span className="leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. SUB-TAB CONTENT ARENA */}
      <div className="min-h-[500px]">
        
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
        {activeSubTab === 'analytics' && (
    <div className="space-y-6">
            
            {/* Header Description */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs font-semibold uppercase tracking-widest text-amber-400">
                    Pro Scholar Mode
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Real-time Curriculum Sync</span>
                </div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Pro Student Analytics & Deep Study Insights
                </h2>
                <p className="text-xs text-slate-400">
                  Monitor syllabus coverage, focus balance, and historical session logs in one place.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2 bg-[#0A0E14] border border-slate-800 rounded-xl px-4 py-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-300 font-mono">DATABASE SYNCED</span>
              </div>
            </div>

            {/* Grid 1: Hero Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Mins */}
              <div className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Total Focused Study
                  </p>
                  <p className="text-xl font-mono font-semibold text-white mt-1">
                    {analyticsData.totalMinsCombined} <span className="text-xs font-sans text-slate-400 font-normal">mins</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Curriculum Coverage */}
              <div className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Curriculum Coverage
                  </p>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <p className="text-xl font-mono font-semibold text-white">
                      {studiedChapters.length}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">/ {totalChaptersInSyllabus} units</span>
                    <span className="text-xs text-indigo-400 font-semibold ml-auto font-mono">
                      {Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0A0E14] h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800/80">
                    <div 
                      className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((studiedChapters.length / (totalChaptersInSyllabus || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Completed Pomodoros today */}
              <div className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Completed Sessions
                  </p>
                  <p className="text-xl font-mono font-semibold text-white mt-1">
                    {analyticsData.totalSessionsCount} <span className="text-xs font-sans text-slate-400 font-normal">registered</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Total XP */}
              <div className="bg-[#141920] border border-slate-800 rounded-xl p-5 shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    XP
                  </p>
                  <p className="text-xl font-mono font-semibold text-amber-300 mt-1">
                    +{(analyticsData.studySessionsCount * 50) + (analyticsData.practiceSessionsCount * 40) + (analyticsData.simulationSessionsCount * 120)} <span className="text-xs font-sans text-slate-400 font-normal">XP</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Grid 2: Distribution & Balance Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Focus Distribution Chart (7 Columns) */}
              <div className="lg:col-span-7 bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                      <h3 className="font-bold text-sm text-white">Focus Weight per Subject</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Interactive Meter</span>
                  </div>

                  {analyticsData.sortedSubjects.length > 0 ? (
                    <div className="space-y-4 pt-2">
                      {analyticsData.sortedSubjects.map(({ subject, minutes }) => {
                        const maxMins = Math.max(...analyticsData.sortedSubjects.map(s => s.minutes)) || 1;
                        const pctOfMax = Math.round((minutes / maxMins) * 100);
                        return (
                          <div key={subject} className="space-y-1.5 group">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors">{subject}</span>
                              <span className="font-mono text-slate-400 font-bold">
                                {minutes} mins
                              </span>
                            </div>
                            <div className="w-full bg-[#0A0E14] h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-700"
                                style={{ width: `${pctOfMax}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-[#0A0E14]/40 border border-slate-800/80 border-dashed rounded-xl">
                      <p className="text-xs text-slate-500 italic">No study logs detected yet. Start the floating study timer to begin gathering analytics!</p>
                      <button 
                        onClick={() => showToast('Use the floating timer button in the bottom-right corner!', 'info')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Start Timer Session
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-400">
                  <span>Want to balance subjects? Use our AI Advisor.</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Right Side: Smart Study Balance advice & Quick link */}
              <div className="lg:col-span-5 bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm pb-4 border-b border-slate-800/80">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Study Balance Adviser</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {analyticsData.balanceAdvice}
                  </p>

                  <div className="bg-[#0A0E14] border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Balanced Syllabus Check</h4>
                    <p className="text-xs text-slate-500">
                      National matric success relies on comprehensive subject knowledge. Concentrating focus too heavily on one area leaves critical scores vulnerable. Keep all subjects above 20 mins!
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Performance History Logs Table */}
            <div className="bg-[#141920] border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Chronological Scholar Session Logs</span>
                  </h3>
                  <p className="text-xs text-slate-500">Filters allow deep examination of logged focus intervals, practices, and full mocks.</p>
                </div>

                {/* Log filters */}
                <div className="flex items-center gap-1.5 p-1 bg-[#0A0E14] border border-slate-800 rounded-xl overflow-x-auto self-start sm:self-auto max-w-full">
                  {(['all', 'study', 'practice', 'simulation'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAnalyticsFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        analyticsFilter === filter
                          ? 'bg-slate-800 text-blue-300 border border-blue-500/20'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* List table - cards on mobile, table on sm+ */}
              <div className="block sm:hidden space-y-2">
                {sessionHistory
                  .filter(h => analyticsFilter === 'all' || h.type === analyticsFilter)
                  .map((h) => {
                    const isStudy = h.type === 'study';
                    const isPrac = h.type === 'practice';
                    const xpValue = isStudy ? 50 : isPrac ? 40 : 120;
                    return (
                      <div key={h.id} className="bg-[#0A0E14] border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-bold text-xs">{h.subject}</p>
                          {h.chapter && <p className="text-slate-500 text-xs mt-0.5 truncate">{h.chapter}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isStudy ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : isPrac ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            }`}>{h.type}</span>
                            <span className="text-slate-500 text-[10px] font-mono">{h.date}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-mono font-bold text-sm">{h.durationMinutes}m</p>
                          <p className="text-amber-300 font-mono text-xs font-semibold">+{xpValue} XP</p>
                        </div>
                      </div>
                    );
                  })}
                {sessionHistory.filter(h => analyticsFilter === 'all' || h.type === analyticsFilter).length === 0 && (
                  <div className="py-10 text-center text-slate-500 italic text-xs">No session entries found.</div>
                )}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs font-sans text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-xs pb-3">
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
                          <tr key={h.id} className="border-b border-slate-800/60 hover:bg-[#0A0E14]/40 transition-all font-medium">
                            <td className="py-3 px-3">
                              <p className="text-white font-bold">{h.subject}</p>
                              {h.chapter && <p className="text-xs text-slate-500 mt-0.5">{h.chapter}</p>}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                isStudy
                                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
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
                            <td className="py-3 px-3 text-slate-400 font-mono text-xs">
                              {h.date}
                            </td>
                            <td className="py-3 px-3 text-right text-amber-300 font-mono font-semibold">
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
          <div className="pt-2 text-slate-100">
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
