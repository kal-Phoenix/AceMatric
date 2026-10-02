import { ReactNode, useState, useEffect } from 'react';
import {
  Bell,
  LogOut,
  Sun,
  Moon,
  X,
  ChevronRight,
  Zap,
  Search,
  BookOpen,
  Target,
  Clock,
  LayoutDashboard,
  Trophy,
  Users,
  Grid,
  Bot,
  User,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Stream } from '../types';
import FloatingTimer from './FloatingTimer';
import GlobalSearch from './GlobalSearch';
import BrandLogo from './ui/BrandLogo';
import UserAvatar from './ui/UserAvatar';

export interface MobileNavItem {
  id: string;
  label: string;
  fullLabel: string;
  icon: ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface MobileShellProps {
  children: ReactNode;
  navItems: MobileNavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  stream: Stream;
  isPremium: boolean;
  user: any;
  onLogout: () => void;
  onOpenUpgrade: () => void;
  onOpenChapa: () => void;
  notifications: Notification[];
  unreadCount: number;
  isNotificationOpen: boolean;
  onNotificationToggle: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNotificationAction: (url: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

// 4 primary core tabs + 1 More menu = 5 items (perfect for mobile ergonomics)
const PRIMARY_TAB_IDS = ['dashboard', 'study', 'practice', 'simulator', 'leaderboard'];

export default function MobileShell({
  children,
  navItems,
  activeTab,
  onTabChange,
  stream,
  isPremium,
  user,
  onLogout,
  onOpenUpgrade,
  notifications,
  unreadCount,
  isNotificationOpen,
  onNotificationToggle,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationAction,
  theme,
  onToggleTheme,
}: MobileShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleTabSelect = (id: string) => {
    onTabChange(id);
    setIsDrawerOpen(false);
  };

  const activeIsPrimary = PRIMARY_TAB_IDS.includes(activeTab);

  // Quick helper to get custom labels/icons for bottom bar
  const getBottomTabMeta = (id: string) => {
    switch (id) {
      case 'dashboard':
        return { label: 'Home', icon: <LayoutDashboard className="w-[20px] h-[20px]" /> };
      case 'study':
        return { label: 'Study', icon: <BookOpen className="w-[20px] h-[20px]" /> };
      case 'practice':
        return { label: 'Practice', icon: <Target className="w-[20px] h-[20px]" /> };
      case 'simulator':
        return { label: 'Mocks', icon: <Clock className="w-[20px] h-[20px]" /> };
      case 'leaderboard':
        return { label: 'Ranks', icon: <Trophy className="w-[20px] h-[20px]" /> };
      default:
        return null;
    }
  };

  // Group items for the native "More" sheet
  const academicTabs = navItems.filter(n => ['study', 'practice', 'simulator', 'matrix', 'explainer'].includes(n.id));
  const communityTabs = navItems.filter(n => n.id === 'collaboration');
  const extraTabs = navItems.filter(n => !['dashboard', 'study', 'practice', 'simulator', 'matrix', 'explainer', 'leaderboard', 'collaboration'].includes(n.id));

  return (
    <div className="flex flex-col w-full min-h-screen overflow-x-hidden bg-[#0A0E14] text-slate-100 font-sans">
      {/* ── 1. NATIVE-FEEL TOP APP BAR ────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-3.5 py-2 glass-header border-b border-white/[0.07] transition-all select-none"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
      >
        {/* Brand & Stream Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabSelect('dashboard')}
            className="cursor-pointer touch-btn active:scale-95 flex items-center"
            aria-label="Go to Dashboard"
          >
            <BrandLogo size="xs" showText={true} glow={true} />
          </button>

          <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/25 text-blue-400">
            {stream === 'Natural Science' ? 'Natural' : 'Social'}
          </span>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-400 hover:text-white touch-btn cursor-pointer"
            aria-label="Search questions and topics"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-400 hover:text-white touch-btn cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Pro Pill (if free user) */}
          {!isPremium && (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm shadow-blue-500/20 touch-btn cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Pro</span>
            </button>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={onNotificationToggle}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-400 hover:text-white touch-btn cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={onNotificationToggle}
                  />
                  <div className="absolute right-0 top-11 w-[min(340px,calc(100vw-24px))] rounded-2xl bg-[#0F141F] border border-white/[0.1] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[min(380px,calc(100dvh-72px))] animate-sheet-up select-none">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-slate-900/50">
                      <span className="text-xs font-bold text-white tracking-wide">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={onMarkAllNotificationsRead}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-white/[0.05]">
                      {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center text-slate-400 text-xs">
                          No notifications yet. You're all caught up!
                        </div>
                      ) : (
                        notifications.map(n => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => {
                              onMarkNotificationRead(n.id);
                              if (n.actionUrl) onNotificationAction(n.actionUrl);
                              onNotificationToggle();
                            }}
                            className={`w-full text-left px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors ${
                              !n.isRead ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-white">{n.title}</span>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Profile Avatar / Login */}
          {user ? (
            <button
              type="button"
              onClick={() => handleTabSelect('profile')}
              className="cursor-pointer touch-btn shrink-0 p-1 -m-1"
              aria-label="Open profile"
            >
              <UserAvatar
                avatar={user.avatar}
                name={user.name}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-white/[0.15] text-xs font-bold text-white shadow-inner ring-2 ring-blue-500/20"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTabSelect('auth')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold touch-btn cursor-pointer shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── 2. SCROLLABLE MAIN CONTENT CANVAS ─────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-h-0">
        <div className="px-3.5 sm:px-5 py-4 sm:py-5 max-w-7xl mx-auto w-full">{children}</div>
      </main>

      {/* ── 3. NATIVE-FEEL FROSTED BOTTOM NAVIGATION BAR ─────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] select-none"
        style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
        aria-label="Primary bottom navigation"
      >
        <div className="flex items-center justify-around h-[58px] px-1 max-w-lg mx-auto">
          {PRIMARY_TAB_IDS.map(tabId => {
            const isActive = activeTab === tabId;
            const meta = getBottomTabMeta(tabId);
            if (!meta) return null;

            return (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabSelect(tabId)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 min-h-[48px] touch-btn cursor-pointer transition-all ${
                  isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Glowing Pill Capsule */}
                {isActive && (
                  <span className="absolute -top-[1px] w-9 h-[3px] rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                )}

                <span className={`transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>
                  {meta.icon}
                </span>

                <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                  {meta.label}
                </span>
              </button>
            );
          })}

          {/* More Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-current={!activeIsPrimary ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 min-h-[48px] touch-btn cursor-pointer transition-all ${
              !activeIsPrimary ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Open more menu"
          >
            {!activeIsPrimary && (
              <span className="absolute -top-[1px] w-9 h-[3px] rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
            )}

            <span className={`flex items-center justify-center h-[20px] transition-transform duration-200 ${!activeIsPrimary ? 'scale-110' : ''}`}>
              <Grid className="w-[19px] h-[19px]" />
            </span>

            <span className={`text-[10px] tracking-tight leading-none ${!activeIsPrimary ? 'font-bold text-white' : 'font-medium'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── 4. MODERN NATIVE BOTTOM SHEET (MORE MENU) ────────────────────── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setIsDrawerOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg glass-sheet border-t border-white/[0.1] rounded-t-[28px] max-h-[85vh] flex flex-col animate-sheet-up overflow-hidden shadow-2xl"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="More navigation sheet"
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-600/70" />
            </div>

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">AceMatric Hub</h3>
                <p className="text-[11px] text-slate-400">Everything you need to conquer your Matric</p>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white touch-btn cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Body with Organized Categories */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4 mobile-scroll">
              {/* Category 1: Academics & Practice */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                  Study & Exam Tools
                </span>
                <div className="bg-[#141924] border border-white/[0.06] rounded-2xl p-1.5 space-y-1">
                  {academicTabs.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl touch-btn cursor-pointer text-left transition-colors ${
                          isActive
                            ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {item.fullLabel || item.label}
                          </div>
                        </div>
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Community & Competitions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                  Community & Ranks
                </span>
                <div className="bg-[#141924] border border-white/[0.06] rounded-2xl p-1.5 space-y-1">
                  {communityTabs.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabSelect(item.id)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl touch-btn cursor-pointer text-left transition-colors ${
                          isActive
                            ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {item.fullLabel || item.label}
                          </div>
                        </div>
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extra Tabs (if any) */}
              {extraTabs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                    Other Resources
                  </span>
                  <div className="bg-[#141924] border border-white/[0.06] rounded-2xl p-1.5 space-y-1">
                    {extraTabs.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabSelect(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl touch-btn cursor-pointer text-left transition-colors ${
                            isActive
                              ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                              : 'hover:bg-slate-800/50 text-slate-300'
                          }`}
                        >
                          <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                              {item.fullLabel || item.label}
                            </div>
                          </div>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pro Upgrade Banner (inside drawer) */}
              {!isPremium && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenUpgrade();
                  }}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-left touch-btn cursor-pointer relative overflow-hidden shadow-lg shadow-blue-500/20"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-200 mb-1">
                        <Sparkles className="w-4 h-4" />
                        Upgrade to AceMatric Pro
                      </div>
                      <p className="text-xs text-blue-100 font-medium leading-snug">
                        Unlimited practice questions, AI explanations, and national past exam papers.
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/80 shrink-0 ml-2" />
                  </div>
                </button>
              )}
            </div>

            {/* Sheet Footer: User Profile & Actions */}
            {user && (
              <div className="p-4 pt-2 border-t border-white/[0.08] bg-[#0C1018]">
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => handleTabSelect('profile')}
                    className="flex items-center gap-3 min-w-0 flex-1 touch-btn cursor-pointer text-left"
                  >
                    <UserAvatar
                      avatar={user.avatar}
                      name={user.name}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/[0.1] text-sm font-bold text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setIsDrawerOpen(false);
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 touch-btn cursor-pointer transition-colors"
                      aria-label="Log out"
                      title="Log out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Timer & Global Search */}
      <FloatingTimer />

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onTabChange}
      />
    </div>
  );
}
