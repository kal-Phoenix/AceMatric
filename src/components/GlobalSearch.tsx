import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, BookOpen, Target, Clock, Users, Trophy, ArrowRight } from 'lucide-react';
import { ETHIOPIAN_CURRICULUM } from '../data/curriculum';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectChapter?: (grade: number, subject: string, chapterNumber: number) => void;
}

interface SearchResult {
  id: string;
  type: 'subject' | 'chapter' | 'tab';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'study', label: 'Study Hub' },
  { id: 'practice', label: 'Practice' },
  { id: 'simulator', label: 'Past Exams' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'collaboration', label: 'Study Rooms' },
  { id: 'upgrade', label: 'Pro Upgrade' },
  { id: 'profile', label: 'Profile' },
  { id: 'contact', label: 'Contact Us' },
  { id: 'faq', label: 'FAQ' },
  { id: 'about', label: 'About' },
];

export default function GlobalSearch({ isOpen, onClose, onNavigate, onSelectChapter }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    NAV_ITEMS.forEach(nav => {
      if (nav.label.toLowerCase().includes(q)) {
        items.push({
          id: `nav-${nav.id}`,
          type: 'tab',
          title: nav.label,
          subtitle: 'Navigation',
          icon: <ArrowRight className="w-4 h-4" />,
          action: () => { onNavigate(nav.id); onClose(); },
        });
      }
    });

    const allStreams = ETHIOPIAN_CURRICULUM;
    allStreams.forEach(stream => {
      stream.subjects.forEach(subj => {
        if (subj.subject.toLowerCase().includes(q) || subj.subject.toLowerCase().replace('maths', 'mathematics').includes(q)) {
          const exists = items.find(i => i.type === 'subject' && i.title === subj.subject);
          if (!exists) {
            items.push({
              id: `subj-${subj.subject}-${subj.grade}`,
              type: 'subject',
              title: subj.subject,
              subtitle: `Grade ${subj.grade} — ${stream.stream} Stream`,
              icon: <BookOpen className="w-4 h-4" />,
              action: () => { onNavigate('study'); onClose(); },
            });
          }
        }
        subj.chapters.forEach(ch => {
          if (ch.chapterName.toLowerCase().includes(q)) {
            items.push({
              id: `ch-${subj.subject}-${subj.grade}-${ch.chapterNumber}`,
              type: 'chapter',
              title: ch.chapterName,
              subtitle: `${subj.subject} — Grade ${subj.grade}, Unit ${ch.chapterNumber}`,
              icon: <Target className="w-4 h-4" />,
              action: () => {
                if (onSelectChapter) onSelectChapter(subj.grade, subj.subject, ch.chapterNumber);
                onNavigate('study');
                onClose();
              },
            });
          }
        });
      });
    });

    return items.slice(0, 12);
  }, [query, onNavigate, onSelectChapter, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4">
      <div className="bg-[#141920] border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, chapters, pages..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type to search across subjects, chapters, and pages
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={result.action}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                {result.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{result.title}</div>
                <div className="text-xs text-slate-400 truncate">{result.subtitle}</div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
