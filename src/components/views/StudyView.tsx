import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Bot, 
  Grid,
  GraduationCap
} from 'lucide-react';
import { Stream, Language, Subject, SessionHistoryEntry } from '../../types';
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

  const subTabs = [
    { id: 'learning', label: 'Notes', fullLabel: 'Study Notes', icon: <BookOpen className="w-4 h-4 text-indigo-400" /> },
    { id: 'curriculum-grid', label: 'Syllabus', fullLabel: 'Syllabus Map', icon: <Grid className="w-4 h-4 text-rose-400" /> },
    { id: 'explainer', label: 'AI Tutor', fullLabel: 'AI Tutor', icon: <Bot className="w-4 h-4 text-emerald-400" /> },
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
