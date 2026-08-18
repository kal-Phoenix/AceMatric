import { ReactNode, useState, useEffect } from 'react';
import {
  MessageSquare,
  BarChart3,
  Sparkles,
  Menu,
  X,
  UserCheck,
  User,
  LogOut,
  Award,
  Zap,
  GraduationCap,
  Trophy,
  Users,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Stream } from '../types';
import FloatingTimer from './FloatingTimer';

export interface NavItem {
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

interface AppShellProps {
  children: ReactNode;
  navItems: NavItem[];
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
}

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export default function AppShell({
  children,
  navItems,
  activeTab,
  onTabChange,
  stream,
  isPremium,
  user,
  onLogout,
  onOpenUpgrade,
  onOpenChapa,
  notifications,
  unreadCount,
  isNotificationOpen,
  onNotificationToggle,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationAction
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1280);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1280);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem('sidebar-collapsed', String(next));
    } catch {}
  };

  const sidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const getHeaderTitle = () => {
    if (activeTab === 'profile') {
      return { icon: <User className="w-4 h-4 text-teal-400" />, title: 'Minimalist Account' };
    }
    const item = navItems.find(n => n.id === activeTab);
    return { icon: item?.icon, title: item?.fullLabel || item?.label || '' };
  };

  return (
    <div className="bg-[#0F172A] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden">
      {/* 1. PRIMARY DESKTOP LEFT SIDEBAR */}
      <aside
        className="hidden xl:flex flex-col bg-[#0F172A] border-r border-slate-800/80 fixed inset-y-0 left-0 z-40 justify-between select-none transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Brand Logo + Toggle */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2" style={{ minHeight: 64 }}>
            <div
              onClick={() => onTabChange('dashboard')}
              className="flex items-center space-x-3 cursor-pointer group min-w-0"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                A
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
                  <div className="font-black text-lg tracking-wide text-white flex items-center gap-1">
                    ACE<span className="text-teal-400">MATRIC</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                    Grade 12 Portal
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all shrink-0 ${
                isSidebarCollapsed ? 'mx-auto mt-1' : ''
              }`}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                    } ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                  {/* Collapsed tooltip */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {item.fullLabel || item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div
            className={`border-t border-slate-800/80 space-y-3 shrink-0 ${
              isSidebarCollapsed ? 'p-2' : 'p-4'
            }`}
          >
            {/* Upgrade / Pro Badge */}
            {!isPremium ? (
              isSidebarCollapsed ? (
                <button
                  onClick={onOpenUpgrade}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Upgrade Pro"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-950/50 to-emerald-950/40 border border-teal-500/30 space-y-2 text-center">
                  <div className="text-xs font-black text-teal-300">
                    Unlimited AI Mock Passes
                  </div>
                  <button
                    onClick={onOpenUpgrade}
                    className="w-full py-2 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upgrade Pro</span>
                  </button>
                </div>
              )
            ) : (
              isSidebarCollapsed ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center" title="PRO Member">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>AceMatric PRO Member</span>
                </div>
              )
            )}

            {/* User Card */}
            {user ? (
              isSidebarCollapsed ? (
                <div className="relative group">
                  <div
                    onClick={() => onTabChange('profile')}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-800/80 transition-all"
                    title={`${user?.name} — Profile`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-teal-400">
                      {user?.name?.[0] || 'S'}
                    </div>
                  </div>
                  {/* Collapsed user tooltip */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    <div>{user?.name}</div>
                    <div className="text-slate-400 text-[10px] font-medium">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div
                    onClick={() => onTabChange('profile')}
                    className="flex items-center space-x-2 min-w-0 cursor-pointer hover:bg-slate-800/80 p-1.5 rounded-xl transition-all"
                    title="Open Profile Settings"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-teal-400 shrink-0">
                      {user?.name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer shrink-0 transition-colors"
                    title="Log Out"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )
            ) : (
              isSidebarCollapsed ? (
                <button
                  onClick={() => onTabChange('auth')}
                  className="w-full p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 transition-colors cursor-pointer flex items-center justify-center"
                  title="Login / Sign Up"
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onTabChange('auth')} className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer text-center">
                    Login
                  </button>
                  <button onClick={() => onTabChange('auth')} className="py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-black transition-colors cursor-pointer text-center">
                    Sign Up
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </aside>

      {/* 2. TOP COMMAND NAVBAR */}
      <header
        className="sticky top-0 z-30 h-16 border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between bg-[#0F172A]/90 backdrop-blur-md transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
      >
        {/* Mobile Left Brand Logo */}
        <div className="flex items-center space-x-2.5 xl:hidden">
          <div onClick={() => onTabChange('dashboard')} className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 shadow-md cursor-pointer">
            A
          </div>
          <span className="font-black text-base tracking-wider text-white">
            ACE<span className="text-teal-400">MATRIC</span>
          </span>
        </div>

        {/* Desktop Current Page Breadcrumb */}
        <div className="hidden xl:flex items-center space-x-3">
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            {getHeaderTitle().icon}
            <span>{getHeaderTitle().title}</span>
          </h1>
        </div>

        {/* Right Student Activity Indicators */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-black hidden sm:block">
            🧬 {stream}
          </span>

          {isPremium ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-black flex items-center gap-1 hidden sm:flex">
              🌟 PRO VIP
            </span>
          ) : (
            <button
              onClick={onOpenUpgrade}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-teal-500/10 transition-all transform active:scale-95 cursor-pointer hidden sm:block"
            >
              🚀 Upgrade
            </button>
          )}

          {/* Notification Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={onNotificationToggle}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white relative cursor-pointer focus:outline-hidden transition-colors"
                title="Academic Notification Centre"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[360px]">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">Live Notification Centre</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[9px] text-slate-400 hover:text-white font-black hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-900 custom-scrollbar">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (notif.actionUrl) {
                            onNotificationAction(notif.actionUrl);
                          }
                          onNotificationToggle();
                        }}
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-900/60 ${!notif.isRead ? 'bg-indigo-500/5' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-slate-200">{notif.title}</span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">{notif.message}</p>
                        <span className="text-[8px] text-slate-500 mt-1.5 block">
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs italic">
                        No live announcements or challenge alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Login CTA */}
          {!user && (
            <button
              onClick={() => onTabChange('auth')}
              className="xl:hidden px-3 py-1.5 bg-teal-500 text-slate-950 rounded-xl text-xs font-black"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* SYNC INDICATOR TOAST - handled in parent */}

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0F172A]/95 backdrop-blur-lg border-t border-slate-800/90 py-2 px-2 flex items-center justify-around shadow-2xl">
        {navItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-teal-400 scale-110 font-black' : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className={isActive ? 'text-teal-400' : 'text-slate-400'}>{item.icon}</div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 font-medium`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-1">More</span>
        </button>
      </nav>

      {/* Mobile More Drawer Sheet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-3 animate-fadeIn">
          <div className="bg-[#131E32] border border-slate-700 w-full max-w-lg rounded-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="font-black text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span>More Academic Tools</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-slate-800 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setIsMobileMenuOpen(false); }}
                  className={`p-4 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                    activeTab === item.id ? 'bg-teal-500 text-slate-950 border-teal-400 font-black' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 font-bold'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs truncate">{item.fullLabel || item.label}</span>
                </button>
              ))}
            </div>

            {user && (
              <div
                onClick={() => { onTabChange('profile'); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-all"
                title="Open Profile Settings"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-teal-400 shrink-0">
                    {user?.name?.[0] || 'S'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer shrink-0 transition-colors"
                  title="Log Out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {!isPremium && (
              <button onClick={() => { setIsMobileMenuOpen(false); onOpenUpgrade(); }} className="w-full py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black rounded-2xl text-xs cursor-pointer">
                🚀 Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN PAGE CONTENT ARENA */}
      <main
        className="flex-1 flex flex-col pb-20 xl:pb-0 min-h-[calc(100vh-4rem)] transition-[padding-left] duration-300 ease-in-out"
        style={{ paddingLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1">
          {children}
        </div>
      </main>

      {/* Floating Study Timer */}
      <FloatingTimer />
    </div>
  );
}
