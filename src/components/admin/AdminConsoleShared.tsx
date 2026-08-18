import { useMemo } from 'react';
import { ChevronDown, ChevronUp, Save, ChevronLeft, type LucideIcon } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type AdminTab = 'dashboard' | 'analytics' | 'users' | 'payments' | 'content';
export type ContentSubTab = 'study-notes' | 'past-exams' | 'practice' | 'mock-exams';

export interface ContentEntry {
  subject: string;
  grade: number;
  chapterNumber: number;
  stream: string;
  title: string;
  overview: string;
  corePoints: string[];
  examTips: string;
  youtubeVideoId: string;
  videoDuration: string;
  subtopics: { title: string; content: string; examInsight: string; imageUrl?: string; imageCaption?: string; imageAlign?: 'left' | 'center' | 'right'; imageSize?: 'small' | 'medium' | 'large' | 'full' }[];
  contentHtml: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface ContentStats {
  total: number;
  published: number;
  draft: number;
  subjects: string[];
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
}

export interface AdminUser {
  email: string;
  name: string;
  stream: string;
  school: string;
  region: string;
  isPremium: boolean;
  xp: number;
  streakDays: number;
  examReadinessScore: number;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  userEmail: string;
  userName: string;
  paymentMethod: string;
  amount: number;
  transactionRef: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  createdAt: string;
}

export type MessageState = { type: 'success' | 'error'; text: string } | null;

// ── Constants ────────────────────────────────────────────────────────────────

export const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Civic Education', 'Economics', 'Geography', 'History', 'Aptitude'];
export const NATURAL_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'];
export const SOCIAL_SUBJECTS = ['Mathematics', 'Geography', 'History', 'Economics', 'English', 'SAT'];
export const GRADES = [9, 10, 11, 12];
export const STREAMS = ['Natural Science', 'Social Science'] as const;

export const SUB_TABS: { id: ContentSubTab; label: string }[] = [
  { id: 'study-notes', label: 'Study Notes' },
  { id: 'past-exams', label: 'Past Exams' },
  { id: 'practice', label: 'Practice' },
  { id: 'mock-exams', label: 'Mock Exams' },
];

export const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Biology':          { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Chemistry':        { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-400' },
  'Physics':          { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-400' },
  'Mathematics':      { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Maths':            { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  'English':          { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
  'History':          { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Geography':        { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', dot: 'bg-teal-400' },
  'Economics':        { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  'Civic Education':  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  'Aptitude':         { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', dot: 'bg-pink-400' },
  'SAT':              { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', dot: 'bg-fuchsia-400' },
};

export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-400' };
}

// ── Utility: count items by grade/subject ────────────────────────────────────

export function useGradeCounts<T extends { grade: number }>(
  allItems: T[],
  filteredItems: T[],
) {
  return useMemo(() => {
    const source = allItems.length > 0 ? allItems : filteredItems;
    const counts: Record<number, number> = {};
    for (const g of GRADES) counts[g] = 0;
    for (const e of source) counts[e.grade] = (counts[e.grade] || 0) + 1;
    return counts;
  }, [allItems, filteredItems]);
}

export function useSubjectCounts<T extends { subject: string; grade?: number; chapterNumber?: number }>(
  allItems: T[],
  filteredItems: T[],
  selectedGrade: number | '',
) {
  return useMemo(() => {
    const source = allItems.length > 0 ? allItems : filteredItems;
    const counts: Record<string, number> = {};
    const seen = new Map<string, Set<number>>();
    for (const e of source) {
      if (selectedGrade !== '' && e.grade !== selectedGrade) continue;
      if (!seen.has(e.subject)) seen.set(e.subject, new Set());
      if (e.chapterNumber != null) seen.get(e.subject)!.add(e.chapterNumber);
    }
    for (const [subj, chapters] of seen) {
      counts[subj] = chapters.size;
    }
    return counts;
  }, [allItems, filteredItems, selectedGrade]);
}

export function useSortedSubjects(counts: Record<string, number>) {
  return useMemo(() => Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0)), [counts]);
}

export function useGroupedBySubject<T extends { subject: string }>(
  items: T[],
) {
  return useMemo(() => {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      if (!groups[item.subject]) groups[item.subject] = [];
      groups[item.subject].push(item);
    }
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map(subject => ({ subject, items: groups[subject] }));
  }, [items]);
}

// ── Shared UI Components ─────────────────────────────────────────────────────

interface StatsCardItem {
  label: string;
  value: number | string;
  color: string;
  bg?: string;
  icon?: LucideIcon;
}

interface StatsCardRowProps {
  stats: ContentStats;
  cards?: StatsCardItem[];
}

export function StatsCardRow({ stats, cards }: StatsCardRowProps) {
  const items: StatsCardItem[] = cards ?? [
    { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-slate-500/10 border-slate-700' },
    { label: 'Published', value: stats.published, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Draft', value: stats.draft, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Subjects', value: stats.subjects.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ label, value, color, bg, icon: Icon }) => (
        <div key={label} className={`rounded-2xl border p-4 ${bg ?? 'bg-[#111827] border-slate-800'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
          </div>
          <div className={`text-2xl font-black ${color}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── StatusPillToggle ──────────────────────────────────────────────────────────

interface StatusPillToggleProps {
  value: 'draft' | 'published';
  onChange: (v: 'draft' | 'published') => void;
}

export function StatusPillToggle({ value, onChange }: StatusPillToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl w-fit">
      <button
        type="button"
        onClick={() => onChange('draft')}
        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
          value === 'draft'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        Draft
      </button>
      <button
        type="button"
        onClick={() => onChange('published')}
        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
          value === 'published'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        Published
      </button>
    </div>
  );
}

// ── YearBadge ─────────────────────────────────────────────────────────────────

export function YearBadge({ year }: { year?: string }) {
  if (!year) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
      {year}
    </span>
  );
}

// ── DifficultyBadge ───────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  Easy:   { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
  Medium: { bg: 'bg-amber-500/15 border-amber-500/30',   text: 'text-amber-400'   },
  Hard:   { bg: 'bg-rose-500/15 border-rose-500/30',     text: 'text-rose-400'    },
};

export function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const cfg = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG]
    ?? { bg: 'bg-slate-500/15 border-slate-500/30', text: 'text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border ${cfg.bg} ${cfg.text}`}>
      {difficulty}
    </span>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
}

export function SectionHeader({ title, subtitle, action, icon: Icon, iconColor = 'text-teal-400' }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface GradeSelectorProps {
  selectedGrade: number | '';
  onSelectGrade: (grade: number | '') => void;
  gradeCounts: Record<number, number>;
  totalCount: number;
}

export function GradeSelector({ selectedGrade, onSelectGrade, gradeCounts, totalCount }: GradeSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      <button
        onClick={() => onSelectGrade('')}
        className={`relative overflow-hidden rounded-xl p-3.5 border text-center transition-all cursor-pointer group ${
          selectedGrade === ''
            ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
            : 'bg-[#111827] border-slate-800 hover:border-slate-700'
        }`}
      >
        {selectedGrade === '' && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
        <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${selectedGrade === '' ? 'text-teal-400' : 'text-slate-600'}`}>All</div>
        <div className={`text-lg font-black ${selectedGrade === '' ? 'text-teal-300' : 'text-slate-400'}`}>{totalCount}</div>
        <div className={`h-1 rounded-full mt-2 ${selectedGrade === '' ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
          <div className={`h-full rounded-full ${selectedGrade === '' ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: '100%' }} />
        </div>
      </button>
      {GRADES.map(g => {
        const isSelected = selectedGrade === g;
        const count = gradeCounts[g] || 0;
        const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
        return (
          <button
            key={g}
            onClick={() => onSelectGrade(isSelected ? '' : g)}
            className={`relative overflow-hidden rounded-xl p-3.5 border text-center transition-all cursor-pointer group ${
              isSelected
                ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
            }`}
          >
            {isSelected && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
            <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isSelected ? 'text-teal-400' : 'text-slate-600'}`}>Grade {g}</div>
            <div className={`text-lg font-black ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>{count}</div>
            <div className={`h-1 rounded-full mt-2 ${isSelected ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
              <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: `${pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface SubjectFilterPillsProps {
  totalItems: number;
  subjectCounts: Record<string, number>;
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  subjects: string[];
}

export function SubjectFilterPills({ totalItems, subjectCounts, selectedSubject, onSelectSubject, subjects }: SubjectFilterPillsProps) {
  if (subjects.length === 0) return null;

  const allItems = [
    { label: 'All', count: totalItems, active: selectedSubject === '', onClick: () => onSelectSubject(''), color: null },
    ...subjects.map(subject => ({
      label: subject,
      count: subjectCounts[subject] || 0,
      active: selectedSubject === subject,
      onClick: () => onSelectSubject(selectedSubject === subject ? '' : subject),
      color: getSubjectColor(subject),
    })),
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {allItems.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
            item.active
              ? 'bg-white/10 text-white border-white/20 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/30'
          }`}
        >
          {'color' in item && item.color ? (
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.active ? item.color.dot : 'bg-slate-700'}`} />
          ) : null}
          <span className="truncate">{item.label}</span>
          <span className={`${item.active ? 'text-slate-400' : 'text-slate-600'} tabular-nums shrink-0`}>{item.count}</span>
        </button>
      ))}
    </div>
  );
}

interface StreamSelectorProps {
  value: string;
  onChange: (stream: string) => void;
}

export function StreamSelector({ value, onChange }: StreamSelectorProps) {
  return (
    <>
      <div className="h-4 w-px bg-slate-800 mx-1" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0B111E] border border-slate-700/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 focus:outline-none focus:border-teal-400 cursor-pointer"
      >
        <option value="">All Streams</option>
        {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </>
  );
}

interface CollapsibleSubjectGroupProps<T> {
  subject: string;
  items: T[];
  collapsedSubjects: Set<string>;
  onToggleCollapse: (key: string) => void;
  renderItem: (item: T, color: { dot: string; text: string; bg: string; border: string }) => React.ReactNode;
  countLabel?: (count: number) => string;
  collapseKey?: string;
}

export function CollapsibleSubjectGroup<T>({ subject, items, collapsedSubjects, onToggleCollapse, renderItem, countLabel, collapseKey }: CollapsibleSubjectGroupProps<T>) {
  const c = getSubjectColor(subject);
  const key = collapseKey ?? subject;
  const isCollapsed = collapsedSubjects.has(key);
  const label = countLabel ? countLabel(items.length) : `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  return (
    <div>
      <button
        onClick={() => onToggleCollapse(key)}
        className="flex items-center gap-2.5 w-full mb-2 group cursor-pointer"
      >
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className={`text-xs font-black ${c.text}`}>{subject}</span>
        <span className="text-[9px] text-slate-600 font-bold">{label}</span>
        <span className="flex-1 h-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
        {isCollapsed ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronUp className="w-3 h-3 text-slate-600" />}
      </button>
      {!isCollapsed && (
        <div className="space-y-1.5 ml-4">
          {items.map((item, i) => (
            <div key={i}>
              {renderItem(item, c)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface ToastMessageProps {
  message: MessageState;
}

export function ToastMessage({ message }: ToastMessageProps) {
  if (!message) return null;

  return (
    <div className={`px-4 py-2 rounded-xl text-xs font-bold ${
      message.type === 'success'
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
    }`}>
      {message.text}
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'No items found.' }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-slate-500 text-sm">{message}</div>
  );
}

// ── Editor Header (back button + title + save) ───────────────────────────────

interface EditorHeaderProps {
  isCreating: boolean;
  title: string;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  saveDisabled?: boolean;
}

export function EditorHeader({ isCreating, title, saving, onSave, onBack, saveDisabled }: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h3 className="text-sm font-black text-white">{isCreating ? `New ${title}` : `Edit: ${title}`}</h3>
      </div>
      <button
        onClick={onSave}
        disabled={saving || saveDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer disabled:opacity-40"
      >
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
