import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Users, CreditCard, TrendingUp, Crown, Search,
  ChevronLeft, ChevronRight, MoreVertical, Star, UserX, CheckCircle2,
  XCircle, Clock, ExternalLink, BarChart3, BookOpen, FileText,
  Plus, Trash2, Save, Upload, Eye, ChevronDown, ChevronUp,
  Copy, History, AlertTriangle, Check, Image, GripVertical,
  HelpCircle, Trophy, CheckSquare, Zap, Medal, Calendar, ClipboardList,
  Filter, Download
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { ETHIOPIAN_CURRICULUM } from '../../data/curriculum';
import {
  StatsCardRow, GradeSelector, SubjectFilterPills, StreamSelector,
  CollapsibleSubjectGroup, LoadingSpinner, ToastMessage, EmptyState,
  EditorHeader, getSubjectColor, useGradeCounts, useSubjectCounts,
  useSortedSubjects, useGroupedBySubject, SUBJECTS, GRADES, SUB_TABS,
  StatusPillToggle, YearBadge, DifficultyBadge, SectionHeader, NATURAL_SUBJECTS, SOCIAL_SUBJECTS,
} from '../admin/AdminConsoleShared';
import type { ContentEntry, ContentStats, MessageState, AdminTab, ContentSubTab } from '../admin/AdminConsoleShared';
import RichTextEditor from '../ui/RichTextEditor';
import { SortableList, SortableItem } from '../ui/SortableList';
import ImageManager from '../ui/ImageManager';
import QuestionBuilder, { type QBQuestion } from '../ui/QuestionBuilder';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', label: 'Rejected' },
};

const METHOD_LABELS: Record<string, string> = {
  cbe: 'CBE Birr',
  telebirr: 'Telebirr',
  abyssinia: 'Bank of Abyssinia',
};

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
}

interface AdminUser {
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
  role: string;
}

interface PaymentRequest {
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

export default function AdminConsoleView({ onBack, currentAdminEmail }: { onBack?: () => void; currentAdminEmail?: string }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const TABS = [
    { id: 'dashboard' as const, label: 'Overview',  icon: TrendingUp,  accent: 'teal'   },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3,   accent: 'indigo' },
    { id: 'users'     as const, label: 'Users',     icon: Users,       accent: 'blue'   },
    { id: 'payments'  as const, label: 'Payments',  icon: CreditCard,  accent: 'amber'  },
    { id: 'content'   as const, label: 'Content',   icon: BookOpen,    accent: 'violet' },
  ];

  const ACCENT: Record<string, { active: string; glow: string; dot: string }> = {
    teal:   { active: 'bg-teal-500/15 text-teal-300 border-teal-500/40',    glow: 'shadow-teal-500/10',   dot: 'bg-teal-400'   },
    indigo: { active: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40', glow: 'shadow-indigo-500/10', dot: 'bg-indigo-400' },
    blue:   { active: 'bg-blue-500/15 text-blue-300 border-blue-500/40',    glow: 'shadow-blue-500/10',   dot: 'bg-blue-400'   },
    amber:  { active: 'bg-amber-500/15 text-amber-300 border-amber-500/40', glow: 'shadow-amber-500/10',  dot: 'bg-amber-400'  },
    violet: { active: 'bg-violet-500/15 text-violet-300 border-violet-500/40', glow: 'shadow-violet-500/10', dot: 'bg-violet-400' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* ── Gradient Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0e1a2b] via-[#0f1d2f] to-[#0a1220] p-5 shadow-xl">
        {/* Animated background orbs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* Icon */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-teal-500/20 rounded-xl blur-md" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/30 to-teal-500/10 border border-teal-500/40 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
            </div>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-400 mt-0.5">Full platform control · Content, Users, Payments & Analytics</p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1.5 p-1.5 bg-[#0d1626] rounded-2xl border border-slate-800/80 shadow-inner">
        {TABS.map(({ id, label, icon: Icon, accent }) => {
          const isActive = activeTab === id;
          const a = ACCENT[accent];
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer border ${
                isActive
                  ? `${a.active} shadow-lg ${a.glow}`
                  : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-800/40'
              }`}
            >
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current opacity-60" />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'users' && <UsersTab currentAdminEmail={currentAdminEmail} />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'content' && <ContentManageTab />}
    </div>
  );
}

/* ── Analytics Tab ───────────────────────────────────────────────────── */

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAdminAnalytics().then(data => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-slate-500 text-sm">Loading analytics...</div>;
  if (!analytics) return <div className="text-center py-12 text-slate-500 text-sm">Failed to load analytics.</div>;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: analytics.totalEvents },
          { label: 'Weekly Active', value: analytics.activeUsersWeekly },
          { label: 'Today Active', value: analytics.activeUsersToday },
          { label: 'Subjects Tracked', value: analytics.subjectPerformance?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111827] rounded-2xl border border-slate-800 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
            <div className="text-2xl font-black text-teal-400 mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Daily Active Users */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-black text-white mb-4">Daily Active Users (7 days)</h3>
        <div className="space-y-2">
          {analytics.dailyActiveUsers.map((day: any) => (
            <div key={day.date} className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 w-20 shrink-0">{day.date}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-teal-500/60 rounded-full transition-all"
                  style={{ width: `${analytics.activeUsersWeekly > 0 ? (day.activeUsers / analytics.activeUsersWeekly) * 100 : 0}%` }}
                />
              </div>
              <span className="text-slate-300 w-16 text-right">{day.activeUsers} users</span>
              <span className="text-slate-500 w-16 text-right">{day.totalSessions} sessions</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-black text-white mb-4">Subject Performance (All Users)</h3>
        <div className="space-y-3">
          {analytics.subjectPerformance.map((subj: any) => (
            <div key={subj.name} className="flex items-center gap-3 text-xs">
              <span className="text-slate-300 w-28 shrink-0 font-bold">{subj.name}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-indigo-500/60 rounded-full transition-all"
                  style={{ width: `${subj.avgScore}%` }}
                />
              </div>
              <span className="text-slate-400 w-20 text-right">{subj.sessions} sessions</span>
              <span className="text-teal-400 w-12 text-right font-black">{subj.avgScore}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-black text-white mb-4">Top Users by Activity</h3>
        <div className="space-y-2">
          {analytics.topUsers.length === 0 && (
            <p className="text-xs text-slate-500">No activity data yet.</p>
          )}
          {analytics.topUsers.map((u: any, i: number) => (
            <div key={u.email} className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 w-6 text-right">#{i + 1}</span>
              <span className="text-slate-300 flex-1 truncate">{u.email}</span>
              <span className="text-teal-400 font-black">{u.sessions} sessions</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Tab ─────────────────────────────────────────────────────── */

function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getAdminStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="text-center py-20 text-slate-500 text-sm">Failed to load stats.</div>;

  const statCards = [
    { label: 'Total Users',       value: stats.totalUsers,       icon: Users,        color: 'text-blue-400',    bg: 'from-blue-500/15 to-blue-500/5',       border: 'border-blue-500/25',    bar: 'bg-blue-400'    },
    { label: 'Premium Users',     value: stats.premiumUsers,     icon: Crown,        color: 'text-amber-400',   bg: 'from-amber-500/15 to-amber-500/5',     border: 'border-amber-500/25',   bar: 'bg-amber-400'   },
    { label: 'Free Users',        value: stats.freeUsers,        icon: Star,         color: 'text-slate-300',   bg: 'from-slate-600/15 to-slate-700/5',     border: 'border-slate-600/30',   bar: 'bg-slate-400'   },
    { label: 'Pending Payments',  value: stats.pendingPayments,  icon: Clock,        color: 'text-amber-400',   bg: 'from-amber-500/15 to-amber-500/5',     border: 'border-amber-500/25',   bar: 'bg-amber-400'   },
    { label: 'Approved Payments', value: stats.approvedPayments, icon: CheckCircle2, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/25', bar: 'bg-emerald-400' },
    { label: 'Rejected Payments', value: stats.rejectedPayments, icon: XCircle,      color: 'text-rose-400',    bg: 'from-rose-500/15 to-rose-500/5',       border: 'border-rose-500/25',    bar: 'bg-rose-400'    },
  ];

  const maxVal = Math.max(...statCards.map(c => c.value), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const pct = Math.round((card.value / maxVal) * 100);
          return (
            <div
              key={card.label}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${card.bg} ${card.border} hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.04] blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className={`text-2xl font-black ${card.color}`}>{card.value}</span>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{card.label}</div>
              <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${card.bar} opacity-60 transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Content Library', icon: BookOpen,   color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Review Payments', icon: CreditCard, color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20'   },
          { label: 'Analytics',       icon: BarChart3,  color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'User Directory',  icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'     },
        ].map(({ label, icon: Icon, color, bg }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${bg}`}>
            <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
            <span className={`text-[10px] font-black ${color}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Users Tab ─────────────────────────────────────────────────────────── */

function UsersTab({ currentAdminEmail }: { currentAdminEmail?: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const pageSize = 20;

  const loadUsers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    const data = await db.getAdminUsers({ page: p, limit: 20, search: s || undefined });
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleTogglePremium = async (email: string, current: boolean) => {
    try {
      await db.setAdminUserPremium(email, !current);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, isPremium: !current } : u));
      setActionMenu(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  const handleToggleRole = async (email: string) => {
    try {
      const user = users.find(u => u.email === email);
      const currentRole = user?.role === 'admin' ? 'admin' : 'student';
      if (currentRole === 'admin' && (user?.email || '').toLowerCase() === (currentAdminEmail || '').toLowerCase()) {
        alert('You cannot demote your own admin role.');
        setActionMenu(null);
        return;
      }
      // Demoting the last admin would lock everyone out of the console
      if (currentRole === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert('You cannot demote the last admin account.');
        setActionMenu(null);
        return;
      }
      const newRole = currentRole === 'admin' ? 'student' : 'admin';
      await db.setAdminUserRole(email, newRole);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
      setActionMenu(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await db.deleteAdminUser(email);
      setUsers(prev => prev.filter(u => u.email !== email));
      setTotal(prev => prev - 1);
      setActionMenu(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or school..."
            className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      <div className="text-[10px] text-slate-500">{total} users found</div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No users found.</div>
      ) : (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_80px_80px_40px] gap-2 px-4 py-2.5 border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
            <span>User</span>
            <span>Stream</span>
            <span>XP</span>
            <span>Streak</span>
            <span></span>
          </div>
          {users.map((u) => (
            <div
              key={u.email}
              className="grid grid-cols-[1fr_120px_80px_80px_40px] gap-2 px-4 py-3 border-b border-slate-800/50 items-center hover:bg-slate-800/20 relative"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{u.name || 'Unnamed'}</span>
                  {u.isPremium && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {u.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
              </div>
              <span className="text-[10px] text-slate-400 truncate">{u.stream || '—'}</span>
              <span className="text-xs font-bold text-teal-400">{u.xp || 0}</span>
              <span className="text-xs font-bold text-amber-400">{u.streakDays || 0}d</span>
              <div className="relative">
                <button
                  onClick={() => setActionMenu(actionMenu === u.email ? null : u.email)}
                  className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </button>
                {actionMenu === u.email && (
                  <div className="absolute right-0 top-full mt-1 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-20 w-44 overflow-hidden">
                    <button
                      onClick={() => handleTogglePremium(u.email, u.isPremium)}
                      className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      {u.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                    </button>
                    <button
                      onClick={() => handleToggleRole(u.email)}
                      className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                    </button>
                    <button
                      onClick={() => handleDelete(u.email)}
                      className="w-full px-3 py-2 text-left text-[11px] font-bold text-rose-400 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Delete User
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-bold">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Payments Tab ──────────────────────────────────────────────────────── */

function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await db.getAllPayments(filter === 'all' ? undefined : filter);
      setPayments(data);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await db.reviewPayment(id, status, reviewNotes.trim());
      setReviewingId(null);
      setReviewNotes('');
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to review payment');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-slate-500">
          {pendingCount} pending review
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filter === f
                  ? 'bg-teal-500/15 text-teal-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No payment requests found.</div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const cfg = STATUS_CONFIG[p.status];
            const StatusIcon = cfg.icon;
            const isReviewing = reviewingId === p.id;

            return (
              <div key={p.id} className={`rounded-2xl border overflow-hidden ${
                p.status === 'pending' ? 'bg-[#111827]/80 border-slate-700/60' : 'bg-[#111827]/40 border-slate-800/60'
              }`}>
                <div className="p-4 flex items-start gap-4">
                  {p.screenshotUrl && (
                    <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 group">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center group-hover:border-teal-500/40 transition-colors">
                        <img src={p.screenshotUrl} alt="Payment proof" className="w-full h-full object-cover" />
                      </div>
                    </a>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-xs text-slate-400 font-bold">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-xs text-slate-300 font-black">{p.amount} ETB</span>
                    </div>
                    <div className="text-sm font-black text-white">{p.userName}</div>
                    <div className="text-[10px] text-slate-500">{p.userEmail}</div>
                    <div className="text-[10px] text-slate-500">
                      Ref: <span className="text-slate-300 font-mono">{p.transactionRef}</span>
                      <span className="mx-1.5">•</span>
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                    {p.adminNotes && p.status !== 'pending' && (
                      <div className="text-[10px] text-slate-400 italic mt-1">Admin note: {p.adminNotes}</div>
                    )}
                  </div>

                  {p.status === 'pending' && !isReviewing && (
                    <button
                      onClick={() => setReviewingId(p.id)}
                      className="px-4 py-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer shrink-0"
                    >
                      Review
                    </button>
                  )}
                </div>

                {isReviewing && (
                  <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 space-y-3 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Admin Notes (optional)</label>
                      <input
                        type="text"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Reason for approval or rejection..."
                        className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(p.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-xl hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(p.id, 'rejected')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black rounded-xl hover:bg-rose-500/25 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                        className="px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Content Management Tab ────────────────────────────────────────────── */

function ContentManageTab() {
  const [subTab, setSubTab] = useState<ContentSubTab>('study-notes');

  const CONTENT_TABS = [
    { id: 'study-notes' as const, label: 'Study Notes', icon: BookOpen,     accent: 'bg-teal-500/15 text-teal-300 border-teal-500/30'    },
    { id: 'past-exams'  as const, label: 'Past Exams',  icon: FileText,     accent: 'bg-blue-500/15 text-blue-300 border-blue-500/30'    },
    { id: 'practice'    as const, label: 'Practice',    icon: HelpCircle,   accent: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    { id: 'mock-exams'  as const, label: 'Mock Exams',  icon: Trophy,       accent: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex gap-1 p-1 bg-[#0d1626] rounded-xl border border-slate-800/80">
        {CONTENT_TABS.map(({ id, label, icon: Icon, accent }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-2 rounded-lg text-[10px] font-black transition-all duration-200 cursor-pointer border ${
              subTab === id
                ? `${accent} shadow-sm`
                : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-800/40'
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {subTab === 'study-notes' && <StudyNotesSubTab />}
      {subTab === 'past-exams'  && <PastExamsSubTab />}
      {subTab === 'practice'    && <PracticeQuestionsSubTab />}
      {subTab === 'mock-exams'  && <MockExamsSubTab />}
    </div>
  );
}

/* ── Study Notes Sub-Tab (existing content management) ─────────────────── */

function StudyNotesSubTab() {
  const [stats, setStats] = useState<{ total: number; published: number; draft: number; subjects: string[] }>({ total: 0, published: 0, draft: 0, subjects: [] });
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [allEntries, setAllEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showImageManager, setShowImageManager] = useState(false);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((key: string) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, entriesData] = await Promise.all([
        db.getContentManageStats(),
        db.getContentManageList({
          subject: selectedSubject || undefined,
          grade: selectedGrade !== '' ? selectedGrade : undefined,
          status: filterStatus || undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setStats(statsData);
      setEntries(entriesData);
      if (!selectedSubject && selectedGrade === '' && !filterStatus && !searchQuery) {
        setAllEntries(entriesData);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load content data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedSubject, selectedGrade, filterStatus, searchQuery]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const gradeCounts = (() => {
    const source = allEntries.length > 0 ? allEntries : entries;
    const counts: Record<number, number> = {};
    for (const g of GRADES) counts[g] = 0;
    for (const e of source) counts[e.grade] = (counts[e.grade] || 0) + 1;
    return counts;
  })();

  const subjectCounts = (() => {
    const source = allEntries.length > 0 ? allEntries : entries;
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
  })();

  const subjectsInEntries = Object.keys(subjectCounts).sort((a, b) => (subjectCounts[b] || 0) - (subjectCounts[a] || 0));

  const handleCreate = () => {
    setEditingEntry({
      subject: 'Mathematics', grade: 9, chapterNumber: 1, stream: '', title: '', overview: '',
      corePoints: [], examTips: '', youtubeVideoId: '', videoDuration: '',
      subtopics: [], contentHtml: '', status: 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setIsCreating(true);
  };

  const handleEdit = async (entry: ContentEntry) => {
    const full = await db.getContentManageEntry(entry.subject, entry.grade, entry.chapterNumber);
    if (full) { setEditingEntry(full); setIsCreating(false); }
    else {
      setEditingEntry(entry);
      setIsCreating(false);
      setMessage({ type: 'error', text: 'Could not refresh entry from server. Loaded from list data.' });
    }
  };

  const handleSave = async () => {
    if (!editingEntry || !editingEntry.title) return;
    setSaving(true);
    try {
      await db.saveContentManageEntry(editingEntry);
      setMessage({ type: 'success', text: 'Content saved successfully' });
      setEditingEntry(null);
      setIsCreating(false);
      await loadData();
      db.getContentManageList().then(setAllEntries).catch(() => {});
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: ContentEntry) => {
    if (!confirm(`Delete ${entry.subject} Grade ${entry.grade} Chapter ${entry.chapterNumber}?`)) return;
    try {
      const result = await db.deleteContentManageEntry(entry.subject, entry.grade, entry.chapterNumber);
      setMessage({ type: 'success', text: `Content deleted${result.imagesRemoved ? ` (${result.imagesRemoved} images cleaned up)` : ''}` });
      await loadData();
      db.getContentManageList().then(setAllEntries).catch(() => {});
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const handleDuplicate = async (entry: ContentEntry) => {
    const newCh = window.prompt(`Duplicate to chapter number:`, String(entry.chapterNumber + 1));
    if (!newCh) return;
    try {
      await db.duplicateContentManage(entry.subject, entry.grade, entry.chapterNumber, parseInt(newCh));
      setMessage({ type: 'success', text: 'Content duplicated' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate' });
    }
  };

  const handleImageUpload = async (file: File) => {
    const result = await db.uploadContentImage(file);
    return result.url;
  };

  const updateEntry = (patch: Partial<ContentEntry>) => {
    if (!editingEntry) return;
    setEditingEntry({ ...editingEntry, ...patch });
  };

  if (editingEntry) {
    return (
      <>
        <ContentEditor
          entry={editingEntry}
          isCreating={isCreating}
          saving={saving}
          message={message}
          onSave={handleSave}
          onBack={() => { setEditingEntry(null); setIsCreating(false); setMessage(null); }}
          onChange={updateEntry}
          uploadImage={handleImageUpload}
          onOpenImageManager={() => setShowImageManager(true)}
        />
        {showImageManager && (
          <ImageManager
            onSelect={(_url) => {
              setShowImageManager(false);
            }}
            onClose={() => setShowImageManager(false)}
          />
        )}
      </>
    );
  }

  const allGrades = selectedGrade === '';
  const allSubjects = selectedSubject === '';

  const displayGroups = (() => {
    if (!allGrades && !allSubjects) {
      return [{ grade: selectedGrade as number, subject: selectedSubject, entries: entries.filter(e => e.subject === selectedSubject) }];
    }
    if (!allGrades && allSubjects) {
      const grouped: { grade: number; subject: string; entries: ContentEntry[] }[] = [];
      const map = new Map<string, ContentEntry[]>();
      for (const e of entries) {
        const k = `${e.subject}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(e);
      }
      for (const [subject, ents] of map) grouped.push({ grade: selectedGrade as number, subject, entries: ents });
      grouped.sort((a, b) => a.subject.localeCompare(b.subject));
      return grouped;
    }
    if (allGrades && !allSubjects) {
      const grouped: { grade: number; subject: string; entries: ContentEntry[] }[] = [];
      const map = new Map<string, ContentEntry[]>();
      for (const e of entries) {
        if (e.subject !== selectedSubject) continue;
        const k = `${e.grade}-${e.subject}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(e);
      }
      for (const [, ents] of map) grouped.push({ grade: ents[0].grade, subject: ents[0].subject, entries: ents });
      grouped.sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));
      return grouped;
    }
    const grouped: { grade: number; subject: string; entries: ContentEntry[] }[] = [];
    const map = new Map<string, ContentEntry[]>();
    for (const e of entries) {
      const k = `${e.grade}-${e.subject}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    for (const [, ents] of map) grouped.push({ grade: ents[0].grade, subject: ents[0].subject, entries: ents });
    grouped.sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));
    return grouped;
  })();

  const gradeGroups = (() => {
    const map = new Map<number, typeof displayGroups>();
    for (const g of displayGroups) {
      if (!map.has(g.grade)) map.set(g.grade, []);
      map.get(g.grade)!.push(g);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  })();

  return (
    <div className="space-y-4">
      <StatsCardRow stats={stats} />

      <GradeSelector
        selectedGrade={selectedGrade}
        onSelectGrade={(g) => { setSelectedGrade(g); setSelectedSubject(''); }}
        gradeCounts={gradeCounts}
        totalCount={stats.total}
      />

      {subjectsInEntries.length > 0 && (
        <SubjectFilterPills
          totalItems={entries.length}
          subjectCounts={subjectCounts}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubject}
          subjects={subjectsInEntries}
        />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search content..."
              className="bg-[#0B111E] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all w-48"
            />
          </form>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all cursor-pointer">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImageManager(true)} className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black rounded-xl hover:bg-slate-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Images
          </button>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> New Content
          </button>
        </div>
      </div>

      {showImageManager && <ImageManager onClose={() => setShowImageManager(false)} />}

      {message && (
        <div className={`px-4 py-2 rounded-xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No content entries found.</div>
      ) : allGrades && allSubjects ? (
        <div className="space-y-6">
          {gradeGroups.map(([grade, subjectGroups]) => {
            const totalForGrade = subjectGroups.reduce((acc, s) => acc + s.entries.length, 0);
            return (
              <div key={grade} className="bg-[#0d1626] border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/40">
                  <span className="text-sm font-black text-teal-400">Grade {grade}</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">{totalForGrade} entries</span>
                  <span className="flex-1 h-px bg-slate-800" />
                  <span className="text-[9px] font-bold text-slate-600">{subjectGroups.length} subjects</span>
                </div>
                <div className="p-4 space-y-4">
                  {subjectGroups.map(({ subject, entries: subEntries }) => (
                    <CollapsibleSubjectGroup
                      key={`${grade}-${subject}`}
                      subject={subject}
                      items={subEntries}
                      collapseKey={`${grade}-${subject}`}
                      collapsedSubjects={collapsedSubjects}
                      onToggleCollapse={(key) => toggleCollapse(key)}
                      countLabel={(n) => `${n} ${n === 1 ? 'chapter' : 'chapters'}`}
                      renderItem={(entry, c) => (
                        <div
                          className="bg-[#0f1629] border border-slate-800/80 rounded-xl p-3 hover:border-slate-700/80 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1 self-stretch rounded-full ${c.dot} opacity-40 group-hover:opacity-80 transition-opacity`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-black text-white">{String(entry.title || 'Untitled')}</span>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${String(entry.status) === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{String(entry.status)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                <span>Ch {entry.chapterNumber}</span>
                                <span>•</span>
                                <span>{String(entry.subtopics?.length || 0)} subtopics</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(ev) => { ev.stopPropagation(); handleEdit(entry as ContentEntry); }} className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                              <button onClick={(ev) => { ev.stopPropagation(); handleDuplicate(entry as ContentEntry); }} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Duplicate"><Copy className="w-3 h-3 text-slate-400" /></button>
                              <button onClick={(ev) => { ev.stopPropagation(); handleDelete(entry as ContentEntry); }} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {displayGroups.map(({ subject, entries: groupEntries }) => (
            <CollapsibleSubjectGroup
              key={`${groupEntries[0]?.grade}-${subject}`}
              subject={subject}
              items={groupEntries}
              collapseKey={`${groupEntries[0]?.grade}-${subject}`}
              collapsedSubjects={collapsedSubjects}
              onToggleCollapse={(key) => toggleCollapse(key)}
              countLabel={(n) => `${n} ${n === 1 ? 'chapter' : 'chapters'}`}
              renderItem={(entry) => (
                <div className="bg-[#0f1629] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 self-stretch rounded-full ${getSubjectColor(subject).dot} opacity-40 group-hover:opacity-80 transition-opacity`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-white">{String(entry.title || 'Untitled')}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${String(entry.status) === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{String(entry.status)}</span>
                        {entry.version ? <span className="text-[9px] text-slate-600">v{entry.version}</span> : null}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span>Ch {entry.chapterNumber}</span>
                        <span>•</span>
                        <span>{String(entry.subtopics?.length || 0)} subtopics</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(ev) => { ev.stopPropagation(); handleEdit(entry as ContentEntry); }} className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleDuplicate(entry as ContentEntry); }} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Duplicate"><Copy className="w-3 h-3 text-slate-400" /></button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleDelete(entry as ContentEntry); }} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                    </div>
                  </div>
                </div>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Content Editor ────────────────────────────────────────────────────── */

function ContentEditor({ entry, isCreating, saving, message, onSave, onBack, onChange, uploadImage, onOpenImageManager }: {
  entry: ContentEntry;
  isCreating: boolean;
  saving: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  onSave: () => void;
  onBack: () => void;
  onChange: (patch: Partial<ContentEntry>) => void;
  uploadImage: (file: File) => Promise<string | null>;
  onOpenImageManager: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<string>(JSON.stringify(entry));
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDirtyRef = useRef(false);

  const entryJson = JSON.stringify(entry);
  useEffect(() => {
    const dirty = entryJson !== lastSavedEntry;
    isDirtyRef.current = dirty;
    setHasUnsavedChanges(dirty);
  }, [entryJson, lastSavedEntry]);

  const autosave = useCallback(async () => {
    if (!isDirtyRef.current || !entry.title) return;
    try {
      await db.saveContentManageEntry(entry);
      setLastSavedEntry(JSON.stringify(entry));
      setHasUnsavedChanges(false);
    } catch { /* silent */ }
  }, [entry]);

  useEffect(() => {
    autosaveTimerRef.current = setInterval(autosave, 30000);
    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, [autosave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleBack = async () => {
    if (isDirtyRef.current) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    onBack();
  };

  const handleSave = async () => {
    await onSave();
    setLastSavedEntry(JSON.stringify(entry));
    setHasUnsavedChanges(false);
  };

  const loadVersions = async () => {
    const v = await db.getContentManageVersions(entry.subject, entry.grade, entry.chapterNumber);
    setVersions(v);
    setShowVersions(true);
  };

  const updateSubtopic = (index: number, field: string, value: string) => {
    const updated = [...entry.subtopics];
    (updated[index] as any)[field] = value;
    onChange({ subtopics: updated });
  };

  const moveSubtopic = (from: number, to: number) => {
    if (to < 0 || to >= entry.subtopics.length) return;
    const updated = [...entry.subtopics];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange({ subtopics: updated });
  };

  const addSubtopic = () => {
    onChange({ subtopics: [...entry.subtopics, { title: '', content: '', examInsight: '' }] });
  };

  const removeSubtopic = (index: number) => {
    onChange({ subtopics: entry.subtopics.filter((_, i) => i !== index) });
  };

  const addCorePoint = () => onChange({ corePoints: [...entry.corePoints, ''] });
  const updateCorePoint = (index: number, value: string) => {
    const updated = [...entry.corePoints]; updated[index] = value; onChange({ corePoints: updated });
  };
  const removeCorePoint = (index: number) => onChange({ corePoints: entry.corePoints.filter((_, i) => i !== index) });
  const moveCorePoint = (from: number, to: number) => {
    if (to < 0 || to >= entry.corePoints.length) return;
    const updated = [...entry.corePoints]; const [moved] = updated.splice(from, 1); updated.splice(to, 0, moved);
    onChange({ corePoints: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <h3 className="text-sm font-black text-white">
            {isCreating ? 'Create New Content' : `Edit: ${entry.subject} G${entry.grade} Ch${entry.chapterNumber}`}
          </h3>
          {hasUnsavedChanges && <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unsaved</span>}
          {entry.version ? <span className="text-[10px] text-slate-500">v{entry.version}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenImageManager} className="flex items-center gap-1 px-3 py-2 text-[10px] font-black text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors cursor-pointer">
            <Upload className="w-3 h-3" /> Images
          </button>
          {!isCreating && (
            <button onClick={loadVersions} className="flex items-center gap-1 px-3 py-2 text-[10px] font-black text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:text-white transition-colors cursor-pointer">
              <History className="w-3 h-3" /> History
            </button>
          )}
          <button onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-2 px-3 py-2 text-xs font-black rounded-xl transition-colors cursor-pointer ${showPreview ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'}`}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving || !entry.title} className="flex items-center gap-2 px-4 py-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer disabled:opacity-40">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>{message.text}</div>
      )}

      {showVersions && <VersionPanel versions={versions} onClose={() => setShowVersions(false)} />}

      {showPreview ? (
        <ContentPreview entry={entry} />
      ) : (
        <>
          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Stream</label>
                <select value={entry.stream || ''} onChange={(e) => onChange({ stream: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all cursor-pointer">
                  <option value="">None</option>
                  <option value="Natural Science">Natural Science</option>
                  <option value="Social Science">Social Science</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                <select value={entry.subject} onChange={(e) => onChange({ subject: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all cursor-pointer">
                  {(entry.stream === 'Natural Science' ? NATURAL_SUBJECTS : entry.stream === 'Social Science' ? SOCIAL_SUBJECTS : SUBJECTS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Grade</label>
                <select value={entry.grade} onChange={(e) => onChange({ grade: parseInt(e.target.value) })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all cursor-pointer">
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Chapter</label>
                <input type="number" value={entry.chapterNumber} onChange={(e) => onChange({ chapterNumber: parseInt(e.target.value) || 1 })} min="1" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
                <select value={entry.status} onChange={(e) => onChange({ status: e.target.value as 'draft' | 'published' })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 transition-all cursor-pointer">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Title</label>
              <input type="text" value={entry.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Chapter title..." className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all font-bold" />
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Overview</h4>
            <RichTextEditor content={entry.overview} onChange={(html) => onChange({ overview: html })} placeholder="Brief overview of this chapter..." uploadImage={uploadImage} minHeight="80px" />
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Core Points ({entry.corePoints.length})</h4>
              <button onClick={addCorePoint} className="flex items-center gap-1 text-[10px] font-black text-teal-400 hover:text-teal-300 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <SortableList items={entry.corePoints} onReorder={moveCorePoint} keyExtractor={(item, i) => `cp-${i}`} renderItem={(point, i) => (
              <SortableItem id={`cp-${i}`}>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-slate-600 w-4 text-center shrink-0">{i + 1}</span>
                  <input type="text" value={point} onChange={(e) => updateCorePoint(i, e.target.value)} placeholder={`Core point ${i + 1}...`} className="flex-1 bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
                  <button onClick={() => removeCorePoint(i)} className="p-1 hover:bg-slate-800 rounded cursor-pointer"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                </div>
              </SortableItem>
            )} />
            {entry.corePoints.length === 0 && <p className="text-[10px] text-slate-500">No core points yet.</p>}
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Subtopics ({entry.subtopics.length})</h4>
              <button onClick={addSubtopic} className="flex items-center gap-1 text-[10px] font-black text-teal-400 hover:text-teal-300 cursor-pointer"><Plus className="w-3 h-3" /> Add Subtopic</button>
            </div>
            <SortableList items={entry.subtopics} onReorder={moveSubtopic} keyExtractor={(item, i) => `sub-${i}`} renderItem={(sub, i) => (
              <SortableItem id={`sub-${i}`}>
                <SubtopicEditor subtopic={sub} index={i} onChange={updateSubtopic} onRemove={removeSubtopic} uploadImage={uploadImage} />
              </SortableItem>
            )} />
            {entry.subtopics.length === 0 && <p className="text-[10px] text-slate-500">No subtopics yet.</p>}
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Exam Tips</h4>
            <RichTextEditor content={entry.examTips} onChange={(html) => onChange({ examTips: html })} placeholder="Tips for exam preparation..." uploadImage={uploadImage} minHeight="100px" />
          </div>

          <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Video</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">YouTube Video ID</label>
                <input type="text" value={entry.youtubeVideoId} onChange={(e) => onChange({ youtubeVideoId: e.target.value })} placeholder="e.g. dQw4w9WgXcQ" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Duration</label>
                <input type="text" value={entry.videoDuration} onChange={(e) => onChange({ videoDuration: e.target.value })} placeholder="e.g. 12:34" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
              </div>
            </div>
            {entry.youtubeVideoId && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-800">
                <iframe src={`https://www.youtube.com/embed/${entry.youtubeVideoId}`} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Subtopic Editor ───────────────────────────────────────────────────── */

function SubtopicEditor({ subtopic, index, onChange, onRemove, uploadImage }: {
  subtopic: { title: string; content: string; examInsight: string; imageUrl?: string; imageCaption?: string; imageAlign?: string; imageSize?: string };
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  uploadImage: (file: File) => Promise<string | null>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleSubtopicImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      if (url) onChange(index, 'imageUrl', url);
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-slate-800/50">
        <span className="text-[10px] font-black text-teal-400 w-6">#{index + 1}</span>
        <input type="text" value={subtopic.title} onChange={(e) => onChange(index, 'title', e.target.value)} placeholder="Subtopic title..." className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none font-bold" />
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-slate-800 rounded cursor-pointer">
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>
        <button onClick={() => onRemove(index)} className="p-1 hover:bg-slate-800 rounded cursor-pointer">
          <Trash2 className="w-3 h-3 text-rose-400" />
        </button>
      </div>
      {expanded && (
        <div className="p-3 space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Content</label>
            <RichTextEditor content={subtopic.content} onChange={(html) => onChange(index, 'content', html)} placeholder="Write the content for this subtopic..." uploadImage={uploadImage} minHeight="120px" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Exam Insight</label>
            <input type="text" value={subtopic.examInsight} onChange={(e) => onChange(index, 'examInsight', e.target.value)} placeholder="Exam tip for this subtopic..." className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Image (optional)</label>
            {subtopic.imageUrl ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-700/50 bg-slate-950/80 p-3 space-y-3">
                  <div className="relative group rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col items-center p-3">
                    <button className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity" title="Drag to reposition">
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <img src={subtopic.imageUrl} alt={subtopic.imageCaption || ''} referrerPolicy="no-referrer" className="max-h-60 w-auto object-contain rounded-xl" />
                    {subtopic.imageCaption && <p className="text-xs text-slate-400 mt-2 italic font-medium text-center">{subtopic.imageCaption}</p>}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <input type="text" value={subtopic.imageUrl} onChange={(e) => onChange(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="flex-1 bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all font-mono" />
                  <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg} className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 text-slate-300 text-[10px] font-black rounded-xl hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-40">
                    {uploadingImg ? '...' : 'Replace'}
                  </button>
                </div>

                <input type="text" value={subtopic.imageCaption || ''} onChange={(e) => onChange(index, 'imageCaption', e.target.value)} placeholder="Image caption (optional)" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value="" onChange={(e) => onChange(index, 'imageUrl', e.target.value)} placeholder="Paste image URL or upload" className="flex-1 bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400 transition-all" />
                <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg} className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer disabled:opacity-40">
                  <Image className="w-3 h-3" />
                  {uploadingImg ? '...' : 'Upload'}
                </button>
              </div>
            )}
            <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleSubtopicImageUpload} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Version Panel ─────────────────────────────────────────────────────── */

function VersionPanel({ versions, onClose }: { versions: any[]; onClose: () => void }) {
  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2"><History className="w-4 h-4 text-teal-400" /> Version History</h4>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded cursor-pointer"><XCircle className="w-4 h-4 text-slate-400" /></button>
      </div>
      {versions.length === 0 ? (
        <p className="text-[10px] text-slate-500">No previous versions.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {versions.map((v, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 rounded-lg text-[10px]">
              <span className="text-teal-400 font-black">v{v.version}</span>
              <span className="text-slate-400 flex-1">{v.title}</span>
              <span className="text-slate-600">{new Date(v.updatedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Content Preview ────────────────────────────────────────────────────── */

function ContentPreview({ entry }: { entry: ContentEntry }) {
  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-800 p-6 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
          <span>{entry.subject}</span><span>•</span><span>Grade {entry.grade}</span><span>•</span><span>Chapter {entry.chapterNumber}</span>
        </div>
        <h1 className="text-xl font-black text-white">{entry.title || 'Untitled'}</h1>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-2 ${entry.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{entry.status}</span>
      </div>
      {entry.overview && <div><h3 className="text-xs font-black text-teal-400 uppercase tracking-wider mb-2">Overview</h3><div className="text-xs text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.overview }} /></div>}
      {entry.corePoints.length > 0 && <div><h3 className="text-xs font-black text-teal-400 uppercase tracking-wider mb-2">Core Points</h3><ol className="space-y-1.5">{entry.corePoints.map((point, i) => <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><span className="text-teal-400 font-black shrink-0">{i + 1}.</span>{point}</li>)}</ol></div>}
      {entry.subtopics.length > 0 && <div><h3 className="text-xs font-black text-teal-400 uppercase tracking-wider mb-3">Subtopics</h3><div className="space-y-4">{entry.subtopics.map((sub, i) => { const a = (sub.imageAlign || 'center') as 'left' | 'center' | 'right'; const s = (sub.imageSize || 'full') as 'small' | 'medium' | 'large' | 'full'; const sz: Record<string, string> = { small: 'max-w-[30%]', medium: 'max-w-[50%]', large: 'max-w-[75%]', full: 'w-full' }; const fl: Record<string, string> = { left: 'float-left mr-4 mb-3', center: 'mx-auto', right: 'float-right ml-4 mb-3' }; return <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 space-y-2 overflow-hidden"><h4 className="text-sm font-black text-white">{sub.title || `Subtopic ${i + 1}`}</h4><div className="text-xs text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none space-y-4">{sub.imageUrl && <div className={`${sz[s]} ${fl[a]} ${a === 'center' ? 'mx-auto' : ''} overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col items-center p-2`}><img src={sub.imageUrl} alt={sub.imageCaption || sub.title} referrerPolicy="no-referrer" className="max-h-60 w-auto object-contain rounded-xl" />{sub.imageCaption && <p className="text-[10px] text-slate-400 mt-1 italic text-center">{sub.imageCaption}</p>}</div>}{(a === 'left' || a === 'right') && <div className="clear-both" />}<div dangerouslySetInnerHTML={{ __html: sub.content }} /></div>{sub.examInsight && <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">{sub.examInsight}</div>}</div>; })}</div></div>}
      {entry.examTips && <div><h3 className="text-xs font-black text-teal-400 uppercase tracking-wider mb-2">Exam Tips</h3><div className="text-xs text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.examTips }} /></div>}
      {entry.youtubeVideoId && <div><h3 className="text-xs font-black text-teal-400 uppercase tracking-wider mb-2">Video</h3><div className="rounded-xl overflow-hidden border border-slate-800"><iframe src={`https://www.youtube.com/embed/${entry.youtubeVideoId}`} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></div>}
    </div>
  );
}

/* ── Past Exams Sub-Tab ───────────────────────────────────────────────── */

function PastExamsSubTab() {
  const [exams, setExams] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, subjects: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  const PAST_EXAM_YEARS = ['2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        db.getPastExamsManageStats(),
        db.getPastExamsManage({ subject: selectedSubject || undefined, yearEC: selectedYear || undefined }),
      ]);
      setStats(s);
      setExams(e);
      if (!selectedSubject && !selectedYear) {
        setAllExams(e);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load past exams' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedSubject, selectedYear]);

  const yearCounts = (() => {
    const source = allExams.length > 0 ? allExams : exams;
    const counts: Record<string, number> = {};
    for (const y of PAST_EXAM_YEARS) counts[y] = 0;
    for (const e of source) {
      const y = e.yearEC || '';
      if (y) counts[y] = (counts[y] || 0) + 1;
    }
    return counts;
  })();

  const subjectCounts = (() => {
    const source = allExams.length > 0 ? allExams : exams;
    const counts: Record<string, number> = {};
    for (const e of source) {
      if (selectedYear && e.yearEC !== selectedYear) continue;
      counts[e.subject] = (counts[e.subject] || 0) + 1;
    }
    return counts;
  })();

  const subjectsInEntries = Object.keys(subjectCounts).sort((a, b) => (subjectCounts[b] || 0) - (subjectCounts[a] || 0));

  const groupedExams = (() => {
    const groups: Record<string, any[]> = {};
    for (const exam of exams) {
      const key = exam.subject;
      if (!groups[key]) groups[key] = [];
      groups[key].push(exam);
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map(subject => ({ subject, exams: groups[subject] }));
  })();

  const toggleSubjectCollapse = (subject: string) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  const handleCreate = () => {
    setEditing({ title: '', grade: 12, subject: 'Mathematics', durationMinutes: 90, questions: [], status: 'draft' });
    setIsCreating(true);
  };

  const handleEdit = async (exam: any) => {
    const full = await db.getPastExamManage(exam.id);
    if (full) { setEditing(full); setIsCreating(false); }
    else { setMessage({ type: 'error', text: 'Failed to load past exam. It may have been deleted.' }); }
  };

  const handleSave = async () => {
    if (!editing || !editing.title) return;
    setSaving(true);
    try {
      await db.savePastExam(editing);
      setMessage({ type: 'success', text: 'Past exam saved' });
      setEditing(null);
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam: any) => {
    if (!confirm(`Delete "${exam.title}"?`)) return;
    try {
      await db.deletePastExam(exam.id);
      setMessage({ type: 'success', text: 'Deleted' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const handleDuplicate = async (exam: any) => {
    try {
      await db.duplicatePastExam(exam.id);
      setMessage({ type: 'success', text: 'Duplicated' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to duplicate' });
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <EditorHeader
          isCreating={isCreating}
          title={editing.title ? editing.title.replace(/<[^>]*>/g, '') || 'Past Exam' : 'Past Exam'}
          saving={saving}
          onSave={handleSave}
          onBack={() => { setEditing(null); setIsCreating(false); setMessage(null); }}
          saveDisabled={!editing.title}
        />
        <ToastMessage message={message} />

        {/* Two-column layout: metadata left, questions right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Metadata panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
              <SectionHeader title="Exam Details" icon={FileText} iconColor="text-blue-400" />
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                <select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Grade</label>
                <select value={editing.grade} onChange={(e) => setEditing({ ...editing, grade: parseInt(e.target.value) })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Duration (min)</label>
                  <input type="number" value={editing.durationMinutes} onChange={(e) => setEditing({ ...editing, durationMinutes: parseInt(e.target.value) || 90 })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Year (E.C.)</label>
                  <input type="text" value={editing.yearEC || ''} onChange={(e) => setEditing({ ...editing, yearEC: e.target.value })} placeholder="e.g. 2016" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Status</label>
                <StatusPillToggle value={editing.status || 'draft'} onChange={(v) => setEditing({ ...editing, status: v })} />
              </div>
            </div>
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
              <SectionHeader title="Title" icon={FileText} iconColor="text-slate-400" />
              <RichTextEditor content={editing.title} onChange={(html) => setEditing({ ...editing, title: html })} placeholder="e.g. Grade 12 Mathematics — 2016 E.C. National Exam" minHeight="40px" />
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Instructions (optional)</label>
                <RichTextEditor content={editing.instructions || ''} onChange={(html) => setEditing({ ...editing, instructions: html })} placeholder="General instructions for students..." minHeight="80px" />
              </div>
            </div>
          </div>

          {/* Questions panel */}
          <div className="lg:col-span-3 bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <SectionHeader title={`Questions (${editing.questions?.length || 0})`} icon={HelpCircle} iconColor="text-violet-400" />
            <QuestionBuilder
              questions={(editing.questions || []).map((q: any) => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }))}
              onChange={(qs: QBQuestion[]) => setEditing({ ...editing, questions: qs, totalQuestions: qs.length })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-emerald-400' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-400' },
          { label: 'Subjects', value: stats.subjects.length, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111827] rounded-2xl border border-slate-800 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
            <div className={`text-2xl font-black ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 overflow-y-auto pr-1 scrollbar-thin">
        <button
          onClick={() => { setSelectedYear(''); }}
          className={`relative overflow-hidden rounded-xl p-3 border text-left transition-all cursor-pointer group ${
            selectedYear === ''
              ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
              : 'bg-[#111827] border-slate-800 hover:border-slate-700'
          }`}
        >
          {selectedYear === '' && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${selectedYear === '' ? 'text-teal-400' : 'text-slate-600'}`}>All</span>
            <span className={`text-sm font-black ${selectedYear === '' ? 'text-teal-300' : 'text-slate-400'}`}>{stats.total}</span>
          </div>
          <div className={`h-1 rounded-full mt-2 ${selectedYear === '' ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
            <div className={`h-full rounded-full ${selectedYear === '' ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: '100%' }} />
          </div>
        </button>
        {PAST_EXAM_YEARS.map(y => {
          const isSelected = selectedYear === y;
          const count = yearCounts[y] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <button
              key={y}
              onClick={() => { setSelectedYear(isSelected ? '' : y); setSelectedSubject(''); }}
              className={`relative overflow-hidden rounded-xl p-3 border text-left transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-teal-400' : 'text-slate-600'}`}>{y} E.C.</span>
                <span className={`text-sm font-black ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>{count}</span>
              </div>
              <div className={`h-1 rounded-full mt-2 ${isSelected ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
                <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {subjectsInEntries.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'All', count: exams.length, active: selectedSubject === '', onClick: () => setSelectedSubject('') },
            ...subjectsInEntries.map(subject => ({
              label: subject,
              count: subjectCounts[subject] || 0,
              active: selectedSubject === subject,
              onClick: () => setSelectedSubject(selectedSubject === subject ? '' : subject),
              color: getSubjectColor(subject),
            })),
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                item.active
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              {'color' in item && item.color ? (
                <span className={`w-2 h-2 rounded-sm ${item.active ? item.color.dot : 'bg-slate-700'}`} />
              ) : null}
              {item.label}
              <span className={`${item.active ? 'text-slate-400' : 'text-slate-600'} tabular-nums`}>{item.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> New Past Exam
        </button>
      </div>

      {message && <div className={`px-4 py-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>{message.text}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No past exams found.</div>
      ) : (
        <div className="space-y-4">
          {groupedExams.map(({ subject, exams: groupExams }) => {
            const c = getSubjectColor(subject);
            const isCollapsed = collapsedSubjects.has(subject);
            return (
              <div key={subject}>
                <button
                  onClick={() => toggleSubjectCollapse(subject)}
                  className="flex items-center gap-2.5 w-full mb-2 group cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-xs font-black ${c.text}`}>{subject}</span>
                  <span className="text-[9px] text-slate-600 font-bold">{groupExams.length} {groupExams.length === 1 ? 'exam' : 'exams'}</span>
                  <span className="flex-1 h-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                  {isCollapsed ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronUp className="w-3 h-3 text-slate-600" />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1.5 ml-4">
                    {groupExams.map((exam: any) => (
                      <div key={exam.id} className="bg-[#0f1629] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700/80 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 self-stretch rounded-full ${c.dot} opacity-40 group-hover:opacity-80 transition-opacity`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-white">{exam.title}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${exam.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{exam.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                              <span className="text-slate-400">G{exam.grade}</span>
                              <span>•</span>
                              <span>{exam.durationMinutes} min</span>
                              <span>•</span>
                              <span>{exam.totalQuestions} questions</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(exam)} className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                            <button onClick={() => handleDuplicate(exam)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Duplicate"><Copy className="w-3 h-3 text-slate-400" /></button>
                            <button onClick={() => handleDelete(exam)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Quizzes Sub-Tab ──────────────────────────────────────────────────── */

function QuizzesSubTab() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, subjects: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([
        db.getQuizzesManageStats(),
        db.getQuizzesManage({ subject: selectedSubject || undefined, grade: selectedGrade !== '' ? selectedGrade : undefined }),
      ]);
      setStats(s);
      setQuizzes(q);
      if (!selectedSubject && selectedGrade === '') {
        setAllQuizzes(q);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load quizzes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedSubject, selectedGrade]);

  const gradeCounts = (() => {
    const source = allQuizzes.length > 0 ? allQuizzes : quizzes;
    const counts: Record<number, number> = {};
    for (const g of GRADES) counts[g] = 0;
    for (const e of source) counts[e.grade] = (counts[e.grade] || 0) + 1;
    return counts;
  })();

  const subjectCounts = (() => {
    const source = allQuizzes.length > 0 ? allQuizzes : quizzes;
    const counts: Record<string, number> = {};
    for (const e of source) {
      if (selectedGrade !== '' && e.grade !== selectedGrade) continue;
      counts[e.subject] = (counts[e.subject] || 0) + 1;
    }
    return counts;
  })();

  const subjectsInEntries = Object.keys(subjectCounts).sort((a, b) => (subjectCounts[b] || 0) - (subjectCounts[a] || 0));

  const groupedQuizzes = (() => {
    const groups: Record<string, any[]> = {};
    for (const quiz of quizzes) {
      const key = quiz.subject;
      if (!groups[key]) groups[key] = [];
      groups[key].push(quiz);
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map(subject => ({ subject, quizzes: groups[subject] }));
  })();

  const toggleSubjectCollapse = (subject: string) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  const handleCreate = () => {
    setEditing({ subject: 'Mathematics', grade: 9, chapterNumber: 1, chapterName: '', questions: [], status: 'draft' });
    setIsCreating(true);
  };

  const handleEdit = async (quiz: any) => {
    const full = await db.getQuizManage(quiz.subject, quiz.grade, quiz.chapterNumber);
    if (full) { setEditing(full); setIsCreating(false); }
    else { setMessage({ type: 'error', text: 'Failed to load quiz. It may have been deleted.' }); }
  };

  const handleSave = async () => {
    if (!editing || !editing.subject) return;
    setSaving(true);
    try {
      await db.saveQuiz(editing);
      setMessage({ type: 'success', text: 'Quiz saved' });
      setEditing(null);
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quiz: any) => {
    if (!confirm(`Delete ${quiz.subject} Grade ${quiz.grade} Chapter ${quiz.chapterNumber}?`)) return;
    try {
      await db.deleteQuiz(quiz.subject, quiz.grade, quiz.chapterNumber);
      setMessage({ type: 'success', text: 'Deleted' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <EditorHeader
          isCreating={isCreating}
          title={editing.chapterName ? editing.chapterName.replace(/<[^>]*>/g, '') || `${editing.subject} Ch${editing.chapterNumber}` : `${editing.subject} G${editing.grade} Ch${editing.chapterNumber}`}
          saving={saving}
          onSave={handleSave}
          onBack={() => { setEditing(null); setIsCreating(false); setMessage(null); }}
        />
        <ToastMessage message={message} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Metadata panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
              <SectionHeader title="Quiz Details" icon={CheckSquare} iconColor="text-indigo-400" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                  <select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Grade</label>
                  <select value={editing.grade} onChange={(e) => setEditing({ ...editing, grade: parseInt(e.target.value) })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Chapter #</label>
                  <input type="number" value={editing.chapterNumber} onChange={(e) => setEditing({ ...editing, chapterNumber: parseInt(e.target.value) || 1 })} min="1" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Difficulty</label>
                  <select value={editing.difficulty || 'Medium'} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Status</label>
                <StatusPillToggle value={editing.status || 'draft'} onChange={(v) => setEditing({ ...editing, status: v })} />
              </div>
            </div>
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Chapter Name</label>
                <RichTextEditor content={editing.chapterName} onChange={(html) => setEditing({ ...editing, chapterName: html })} placeholder="e.g. Introduction to Algebra" minHeight="40px" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Description / Instructions (optional)</label>
                <RichTextEditor content={editing.description || ''} onChange={(html) => setEditing({ ...editing, description: html })} placeholder="Brief description or special instructions for this quiz..." minHeight="80px" />
              </div>
            </div>
          </div>

          {/* Questions panel */}
          <div className="lg:col-span-3 bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
            <SectionHeader title={`Questions (${editing.questions?.length || 0})`} icon={HelpCircle} iconColor="text-violet-400" />
            <QuestionBuilder
              questions={(editing.questions || []).map((q: any) => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }))}
              onChange={(qs: QBQuestion[]) => setEditing({ ...editing, questions: qs })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-emerald-400' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-400' },
          { label: 'Subjects', value: stats.subjects.length, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111827] rounded-2xl border border-slate-800 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
            <div className={`text-2xl font-black ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={() => { setSelectedGrade(''); }}
          className={`relative overflow-hidden rounded-xl p-3 border text-left transition-all cursor-pointer group ${
            selectedGrade === ''
              ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
              : 'bg-[#111827] border-slate-800 hover:border-slate-700'
          }`}
        >
          {selectedGrade === '' && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${selectedGrade === '' ? 'text-teal-400' : 'text-slate-600'}`}>All</span>
            <span className={`text-sm font-black ${selectedGrade === '' ? 'text-teal-300' : 'text-slate-400'}`}>{stats.total}</span>
          </div>
          <div className={`h-1 rounded-full mt-2 ${selectedGrade === '' ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
            <div className={`h-full rounded-full ${selectedGrade === '' ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: '100%' }} />
          </div>
        </button>
        {GRADES.map(g => {
          const isSelected = selectedGrade === g;
          const count = gradeCounts[g] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <button
              key={g}
              onClick={() => { setSelectedGrade(isSelected ? '' : g); setSelectedSubject(''); }}
              className={`relative overflow-hidden rounded-xl p-3 border text-left transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-lg shadow-teal-500/5'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -mr-5 -mt-5" />}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-teal-400' : 'text-slate-600'}`}>G-{g}</span>
                <span className={`text-sm font-black ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>{count}</span>
              </div>
              <div className={`h-1 rounded-full mt-2 ${isSelected ? 'bg-teal-500/40' : 'bg-slate-800'}`}>
                <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-teal-400' : 'bg-slate-700'}`} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {subjectsInEntries.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'All', count: quizzes.length, active: selectedSubject === '', onClick: () => setSelectedSubject('') },
            ...subjectsInEntries.map(subject => ({
              label: subject,
              count: subjectCounts[subject] || 0,
              active: selectedSubject === subject,
              onClick: () => setSelectedSubject(selectedSubject === subject ? '' : subject),
              color: getSubjectColor(subject),
            })),
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                item.active
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              {'color' in item && item.color ? (
                <span className={`w-2 h-2 rounded-sm ${item.active ? item.color.dot : 'bg-slate-700'}`} />
              ) : null}
              {item.label}
              <span className={`${item.active ? 'text-slate-400' : 'text-slate-600'} tabular-nums`}>{item.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> New Quiz
        </button>
      </div>

      {message && <div className={`px-4 py-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>{message.text}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No quizzes found.</div>
      ) : (
        <div className="space-y-4">
          {groupedQuizzes.map(({ subject, quizzes: groupQuizzes }) => {
            const c = getSubjectColor(subject);
            const isCollapsed = collapsedSubjects.has(subject);
            return (
              <div key={subject}>
                <button
                  onClick={() => toggleSubjectCollapse(subject)}
                  className="flex items-center gap-2.5 w-full mb-2 group cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-xs font-black ${c.text}`}>{subject}</span>
                  <span className="text-[9px] text-slate-600 font-bold">{groupQuizzes.length} {groupQuizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
                  <span className="flex-1 h-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                  {isCollapsed ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronUp className="w-3 h-3 text-slate-600" />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1.5 ml-4">
                    {groupQuizzes.map((quiz: any) => (
                      <div key={quiz.id} className="bg-[#0f1629] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700/80 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 self-stretch rounded-full ${c.dot} opacity-40 group-hover:opacity-80 transition-opacity`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-white">{quiz.chapterName || `${quiz.subject} G${quiz.grade} Ch${quiz.chapterNumber}`}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${quiz.status === 'published' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{quiz.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                              <span className="text-slate-400">G{quiz.grade}</span>
                              <span>•</span>
                              <span>Ch {quiz.chapterNumber}</span>
                              <span>•</span>
                              <span>{quiz.questions?.length || 0} questions</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(quiz)} className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                            <button onClick={() => handleDelete(quiz)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Questions Sub-Tab ────────────────────────────────────────────────── */

function PracticeQuestionsSubTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; published: number; draft: number; subjects: string[] }>({ total: 0, published: 0, draft: 0, subjects: [] });
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getQuestions({ questionType: 'practice' });
      setQuestions(data);
      const subjects = [...new Set(data.map((q: any) => q.subject))];
      setStats({ total: data.length, published: data.filter((q: any) => q.status === 'published').length, draft: data.filter((q: any) => q.status === 'draft').length, subjects });
    } catch {
      setMessage({ type: 'error', text: 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Extract grade from chapter string
  const getGrade = (q: any) => {
    const match = (q.chapter || '').match(/Grade\s+(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  // Grade counts
  const gradeCounts = (() => {
    const counts: Record<number, number> = {};
    for (const q of questions) {
      const grade = getGrade(q);
      counts[grade] = (counts[grade] || 0) + 1;
    }
    return counts;
  })();

  // Filter by grade
  const gradeFiltered = selectedGrade
    ? questions.filter(q => getGrade(q) === selectedGrade)
    : questions;

  // Subject counts for selected grade
  const subjectCounts = (() => {
    const counts: Record<string, number> = {};
    for (const q of gradeFiltered) {
      counts[q.subject] = (counts[q.subject] || 0) + 1;
    }
    return counts;
  })();
  const subjectsInGrade = Object.keys(subjectCounts).sort((a, b) => (subjectCounts[b] || 0) - (subjectCounts[a] || 0));

  // Filter by subject
  const subjectFiltered = selectedSubject
    ? gradeFiltered.filter(q => q.subject === selectedSubject)
    : gradeFiltered;

  // Chapter counts for selected grade + subject
  const chapterCounts = (() => {
    const counts: Record<string, number> = {};
    // First, count actual questions per chapter
    for (const q of subjectFiltered) {
      const ch = q.chapter || 'Uncategorized';
      counts[ch] = (counts[ch] || 0) + 1;
    }
    // Then, add all curriculum chapters for the selected grade + subject (even if 0 questions)
    if (selectedGrade && selectedSubject) {
      const searchSubject = selectedSubject === 'Mathematics' ? 'Maths' : selectedSubject;
      for (const stream of ETHIOPIAN_CURRICULUM) {
        const subjectData = stream.subjects.find(s => s.subject.toLowerCase() === searchSubject.toLowerCase() && s.grade === selectedGrade);
        if (subjectData) {
          for (const ch of subjectData.chapters) {
            if (ch.chapterName && ch.chapterName.trim()) {
              const chKey = `Grade ${selectedGrade} - Chapter ${ch.chapterNumber}: ${ch.chapterName}`;
              if (!(chKey in counts)) counts[chKey] = 0;
            }
          }
        }
      }
    }
    return counts;
  })();
  const chaptersInSubject = Object.keys(chapterCounts).sort((a, b) => a.localeCompare(b));

  // Filter by chapter
  const chapterFiltered = selectedChapter
    ? subjectFiltered.filter(q => q.chapter === selectedChapter)
    : subjectFiltered;

  // Final filtered questions (add difficulty filter)
  const filteredQuestions = filterDifficulty
    ? chapterFiltered.filter(q => q.difficulty === filterDifficulty)
    : chapterFiltered;

  const toggleCollapse = () => {};

  const handleCreate = () => {
    const gradeStr = selectedGrade || 12;
    setEditing({ id: `q-${Date.now()}`, subject: selectedSubject || 'Physics', stream: 'Natural Science', chapter: selectedChapter || `Grade ${gradeStr} - Chapter 1: `, yearEC: '2024 E.C.', questionText: '', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }], correctOptionId: 'a', explanation: '', difficulty: 'Medium', questionType: 'practice' });
    setIsCreating(true);
  };

  const handleEdit = (q: any) => { setEditing({ ...q }); setIsCreating(false); };

  const handleSave = async () => {
    if (!editing || !editing.questionText) return;
    setSaving(true);
    try {
      if (isCreating) {
        await db.createQuestion(editing);
      } else {
        await db.updateQuestion(editing.id, editing);
      }
      setMessage({ type: 'success', text: 'Question saved' });
      setEditing(null);
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: any) => {
    if (!confirm('Delete this question?')) return;
    try {
      await db.deleteQuestion(q.id);
      setMessage({ type: 'success', text: 'Deleted' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  // Breadcrumb navigation
  const breadcrumbs = [
    { label: 'All Grades', onClick: () => { setSelectedGrade(''); setSelectedSubject(''); setSelectedChapter(''); } },
    selectedGrade ? { label: `Grade ${selectedGrade}`, onClick: () => { setSelectedSubject(''); setSelectedChapter(''); } } : null,
    selectedSubject ? { label: selectedSubject, onClick: () => { setSelectedChapter(''); } } : null,
    selectedChapter ? { label: selectedChapter.replace(/Grade \d+ - /g, ''), onClick: null } : null,
  ].filter(Boolean) as { label: string; onClick: (() => void) | null }[];

  if (editing) {
    return (
      <div className="space-y-4">
        <EditorHeader
          isCreating={isCreating}
          title="Practice Question"
          saving={saving}
          onSave={handleSave}
          onBack={() => { setEditing(null); setIsCreating(false); setMessage(null); }}
          saveDisabled={!editing.questionText}
        />
        <ToastMessage message={message} />
        <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
              <select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Stream</label>
              <select value={editing.stream} onChange={(e) => setEditing({ ...editing, stream: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                <option value="Natural Science">Natural Science</option>
                <option value="Social Science">Social Science</option>
                <option value="Common">Common</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Difficulty</label>
              <select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Year EC</label>
              <input type="text" value={editing.yearEC} onChange={(e) => setEditing({ ...editing, yearEC: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Chapter</label>
            <input type="text" value={editing.chapter} onChange={(e) => setEditing({ ...editing, chapter: e.target.value })} placeholder="Grade 12 - Chapter 1: Mechanics" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Question Text</label>
            <RichTextEditor content={editing.questionText} onChange={(html) => setEditing({ ...editing, questionText: html })} placeholder="Enter the question..." minHeight="60px" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Options (click to mark correct)</label>
            {(editing.options || []).map((opt: any, i: number) => (
              <div key={opt.id} className="flex items-start gap-2">
                <button onClick={() => setEditing({ ...editing, correctOptionId: opt.id })} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer mt-1 ${editing.correctOptionId === opt.id ? 'bg-teal-500 border-teal-500' : 'border-slate-600 hover:border-slate-400'}`}>
                  {editing.correctOptionId === opt.id && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-[10px] font-black text-slate-500 w-4 shrink-0 mt-1">{opt.id.toUpperCase()}.</span>
                <div className="flex-1">
                  <RichTextEditor content={opt.text} onChange={(html) => { const newOpts = [...editing.options]; newOpts[i] = { ...newOpts[i], text: html }; setEditing({ ...editing, options: newOpts }); }} placeholder={`Option ${opt.id.toUpperCase()}...`} minHeight="36px" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Explanation</label>
            <RichTextEditor content={editing.explanation} onChange={(html) => setEditing({ ...editing, explanation: html })} placeholder="Explain the correct answer..." minHeight="60px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsCardRow stats={stats} />

      {/* Breadcrumb */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center gap-1.5 text-[11px]">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-600">/</span>}
              {bc.onClick ? (
                <button onClick={bc.onClick} className="text-teal-400 hover:text-teal-300 font-bold cursor-pointer transition-colors">{bc.label}</button>
              ) : (
                <span className="text-slate-300 font-black">{bc.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Level 1: Grade Selector */}
      {!selectedGrade && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[9, 10, 11, 12].map(grade => {
            const count = gradeCounts[grade] || 0;
            return (
              <button
                key={grade}
                onClick={() => { setSelectedGrade(grade); setSelectedSubject(''); setSelectedChapter(''); }}
                className="bg-[#0d1626] border border-slate-800/80 rounded-2xl p-4 text-center hover:border-teal-500/40 transition-all cursor-pointer group"
              >
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Grade {grade}</div>
                <div className="text-2xl font-black text-white group-hover:text-teal-400 transition-colors">{count}</div>
                <div className="mt-2 h-1 bg-slate-800/60 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Level 2: Subject Selector (when grade selected, no subject yet) */}
      {selectedGrade && !selectedSubject && (
        <div className="space-y-3">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Subjects in Grade {selectedGrade}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjectsInGrade.map(subject => (
              <button
                key={subject}
                onClick={() => { setSelectedSubject(subject); setSelectedChapter(''); }}
                className="bg-[#0d1626] border border-slate-800/80 rounded-2xl p-4 text-left hover:border-teal-500/40 transition-all cursor-pointer group flex items-center justify-between"
              >
                <span className="text-xs font-black text-slate-300 group-hover:text-teal-400 transition-colors">{subject}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">{subjectCounts[subject]} questions</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level 3: Chapter Selector (when grade + subject selected, no chapter yet) */}
      {selectedGrade && selectedSubject && !selectedChapter && (
        <div className="space-y-3">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Chapters in {selectedSubject}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chaptersInSubject.map(ch => {
              const displayName = ch.replace(/Grade \d+ - /g, '');
              const count = chapterCounts[ch];
              return (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  className="bg-[#0d1626] border border-slate-800/80 rounded-2xl p-4 text-left hover:border-teal-500/40 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <span className="text-xs font-black text-slate-300 group-hover:text-teal-400 transition-colors">{displayName}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">{count} {count === 1 ? 'question' : 'questions'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Level 4: Questions List (when grade + subject + chapter selected) */}
      {selectedGrade && selectedSubject && selectedChapter && (
        <>
          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['', 'Easy', 'Medium', 'Hard'] as const).map(d => {
              const DIFF_STYLE: Record<string, string> = {
                '':     'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:bg-slate-800/30',
                Easy:   filterDifficulty === 'Easy'   ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:bg-slate-800/30',
                Medium: filterDifficulty === 'Medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'       : 'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:bg-slate-800/30',
                Hard:   filterDifficulty === 'Hard'   ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'         : 'text-slate-500 hover:text-slate-300 border-slate-800/60 hover:bg-slate-800/30',
              };
              return (
                <button
                  key={d || 'all'}
                  onClick={() => setFilterDifficulty(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${filterDifficulty === d && !d ? 'bg-white/10 text-white border-white/20' : DIFF_STYLE[d]}`}
                >
                  {d || 'All Difficulty'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-500">{filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'}</div>
            <div className="flex items-center gap-2">
              <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> New Question
              </button>
            </div>
          </div>

          <ToastMessage message={message} />

          {loading ? (
            <LoadingSpinner />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState message="No questions in this chapter." />
          ) : (
            <div className="bg-[#0d1626] border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
              {filteredQuestions.map((q: any) => (
                <div key={q.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-900/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 line-clamp-1">{q.questionText.replace(/<[^>]*>/g, '')}</span>
                  </div>
                  <DifficultyBadge difficulty={q.difficulty} />
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(q)} className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[9px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(q)} className="p-0.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Mock Exams Sub-Tab ───────────────────────────────────────────────── */

function MockExamsSubTab() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getMockExams({ subject: filterSubject || undefined, stream: filterStream || undefined });
      setExams(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load mock exams' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterSubject, filterStream]);

  const handleCreate = () => {
    setEditing({ id: `mock-${Date.now()}`, title: '', stream: 'Natural Science', subject: 'Mathematics', durationMinutes: 60, totalQuestions: 0, questionIds: [] });
    setIsCreating(true);
  };

  const handleEdit = (exam: any) => { setEditing({ ...exam }); setIsCreating(false); };

  const handleSave = async () => {
    if (!editing || !editing.title) return;
    setSaving(true);
    try {
      if (isCreating) {
        await db.createMockExam(editing);
      } else {
        await db.updateMockExam(editing.id, editing);
      }
      setMessage({ type: 'success', text: 'Mock exam saved' });
      setEditing(null);
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam: any) => {
    if (!confirm(`Delete "${exam.title}"?`)) return;
    try {
      await db.deleteMockExam(exam.id);
      setMessage({ type: 'success', text: 'Deleted' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const groupedExams = useGroupedBySubject(exams);

  if (editing) {
    return (
      <div className="space-y-4">
        <EditorHeader
          isCreating={isCreating}
          title={editing.title ? editing.title.replace(/<[^>]*>/g, '') || 'Mock Exam' : 'Mock Exam'}
          saving={saving}
          onSave={handleSave}
          onBack={() => { setEditing(null); setIsCreating(false); setMessage(null); }}
          saveDisabled={!editing.title}
        />
        <ToastMessage message={message} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Metadata panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
              <SectionHeader title="Exam Details" icon={Trophy} iconColor="text-amber-400" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                  <select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="Full National Exam">Full National Exam</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Stream</label>
                  <select value={editing.stream} onChange={(e) => setEditing({ ...editing, stream: e.target.value })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer">
                    <option value="Natural Science">Natural Science</option>
                    <option value="Social Science">Social Science</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Duration (min)</label>
                  <input type="number" value={editing.durationMinutes} onChange={(e) => setEditing({ ...editing, durationMinutes: parseInt(e.target.value) || 60 })} className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Year (E.C.)</label>
                  <input type="text" value={editing.yearEC || ''} onChange={(e) => setEditing({ ...editing, yearEC: e.target.value })} placeholder="e.g. 2016" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400" />
                </div>
              </div>
            </div>
            <div className="bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Title</label>
                <RichTextEditor content={editing.title} onChange={(html) => setEditing({ ...editing, title: html })} placeholder="e.g. Grade 12 Full Mock Exam — Natural" minHeight="40px" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Title (Amharic)</label>
                <input type="text" value={editing.titleAmharic || ''} onChange={(e) => setEditing({ ...editing, titleAmharic: e.target.value })} placeholder="Optional Amharic title" className="w-full bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Description (optional)</label>
                <RichTextEditor content={editing.description || ''} onChange={(html) => setEditing({ ...editing, description: html })} placeholder="Brief description of this mock exam..." minHeight="70px" />
              </div>
            </div>
          </div>

          {/* Questions info panel */}
          <div className="lg:col-span-3 bg-[#111827] rounded-2xl border border-slate-800 p-5 space-y-4">
            <SectionHeader title="Linked Questions" icon={HelpCircle} iconColor="text-violet-400" />
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Total Questions (count)</label>
              <input type="number" value={editing.totalQuestions} onChange={(e) => setEditing({ ...editing, totalQuestions: parseInt(e.target.value) || 0 })} className="w-48 bg-[#0B111E] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-300">{editing.questionIds?.length || 0} question IDs linked</span>
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black cursor-not-allowed opacity-60">
                    <ClipboardList className="w-3 h-3" /> Link Questions
                  </button>
                  <div className="absolute -top-8 right-0 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Coming soon</div>
                </div>
              </div>
              {(editing.questionIds?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                  {editing.questionIds.map((id: string, i: number) => (
                    <span key={id} className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-mono">{i + 1}. {id.slice(0, 8)}…</span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 italic">No question IDs linked yet. Use the total questions count above to set the exam size manually.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }




  const subjectCounts = (() => {
    const counts: Record<string, number> = {};
    for (const e of exams) counts[e.subject] = (counts[e.subject] || 0) + 1;
    return counts;
  })();

  const subjectsInExams = Object.keys(subjectCounts).sort((a, b) => (subjectCounts[b] || 0) - (subjectCounts[a] || 0));

  const toggleSubjectCollapse = (subject: string) => {
    setCollapsedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        <SubjectFilterPills
          totalItems={exams.length}
          subjectCounts={subjectCounts}
          selectedSubject={filterSubject}
          onSelectSubject={setFilterSubject}
          subjects={subjectsInExams}
        />
        <StreamSelector value={filterStream} onChange={setFilterStream} />
      </div>

      <div className="flex items-center justify-end">
        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-black rounded-xl hover:bg-teal-500/25 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> New Mock Exam
        </button>
      </div>

      <ToastMessage message={message} />

      {loading ? (
        <LoadingSpinner />
      ) : exams.length === 0 ? (
        <EmptyState message="No mock exams found." />
      ) : (
        <div className="space-y-4">
          {groupedExams.map(({ subject, items: groupExams }) => (
            <CollapsibleSubjectGroup
              key={subject}
              subject={subject}
              items={groupExams}
              collapsedSubjects={collapsedSubjects}
              onToggleCollapse={toggleSubjectCollapse}
              countLabel={(n) => `${n} ${n === 1 ? 'exam' : 'exams'}`}
              renderItem={(exam, c) => (
                <div className="bg-[#0f1629] border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 self-stretch rounded-full ${c.dot} opacity-40 group-hover:opacity-80 transition-opacity`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-black text-white">{exam.title}</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span>{exam.stream}</span>
                        <span>•</span>
                        <span>{exam.durationMinutes} min</span>
                        <span>•</span>
                        <span>{exam.totalQuestions} questions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(exam)} className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black rounded-lg hover:bg-teal-500/20 transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(exam)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-3 h-3 text-rose-400" /></button>
                    </div>
                  </div>
                </div>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Curated Notes Sub-Tab ────────────────────────────────────────────── */


