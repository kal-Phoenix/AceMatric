import { ReactNode, useState, useEffect } from 'react';
import {
  MessageSquare,
  BarChart3,
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
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { Stream } from '../types';
import FloatingTimer from './FloatingTimer';
import GlobalSearch from './GlobalSearch';
import BrandLogo from './ui/BrandLogo';

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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  onNotificationAction,
  theme,
  onToggleTheme,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
      return { icon: <User className="w-4 h-4 text-slate-400" />, title: 'Profile' };
    }
    const item = navItems.find(n => n.id === activeTab);
    return { icon: item?.icon, title: item?.fullLabel || item?.label || '' };
  };

  return (
    <div className="bg-[#0A0E14] text-slate-100 font-sans w-full min-h-screen flex flex-col relative overflow-x-hidden">
      {/* 1. PRIMARY DESKTOP LEFT SIDEBAR */}
      <aside
        className="hidden xl:flex flex-col bg-[#0A0E14] border-r border-slate-800/60 fixed inset-y-0 left-0 z-40 justify-between select-none transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Brand Logo + Toggle */}
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1 px-2 pt-4 pb-2" style={{ minHeight: 64 }}>
              <div
                onClick={() => onTabChange('dashboard')}
                className="cursor-pointer group"
                title="AceMatric Dashboard"
              >
                <BrandLogo size="sm" showText={false} glow={true} />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 pt-4 pb-2" style={{ minHeight: 64 }}>
              <div
                onClick={() => onTabChange('dashboard')}
                className="cursor-pointer group min-w-0"
                title="AceMatric Dashboard"
              >
                <BrandLogo size="md" showText={true} glow={true} />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`accent-bar w-full flex items-center gap-3 rounded-lg text-sm transition-all cursor-pointer ${
                      isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'active bg-blue-500/[0.08] text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                  {isSidebarCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {item.fullLabel || item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div
            className={`border-t border-slate-800/60 space-y-2 shrink-0 ${
              isSidebarCollapsed ? 'p-2' : 'p-3'
            }`}
          >
            {!isPremium ? (
              isSidebarCollapsed ? (
                <button
                  onClick={onOpenUpgrade}
                  className="w-full p-2.5 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
                  title="Upgrade"
                >
                  <Zap className="w-4 h-4" />
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800/60 space-y-2">
                  <div className="text-xs font-medium text-slate-300">
                    Get Pro
                  </div>
                  <button
                    onClick={onOpenUpgrade}
                    className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Upgrade
                  </button>
                </div>
              )
            ) : (
              isSidebarCollapsed ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center" title="Pro member">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Pro member</span>
                </div>
              )
            )}

            {user ? (
              isSidebarCollapsed ? (
                <div className="relative group">
                  <div
                    onClick={() => onTabChange('profile')}
                    className="w-full p-2.5 rounded-lg bg-slate-800/60 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all"
                    title={`${user?.name} — Profile`}
                  >
                    {user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-medium text-slate-300">
                        {user?.name?.[0] || 'S'}
                      </div>
                    )}
                  </div>
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                    <div>{user?.name}</div>
                    <div className="text-slate-400 text-xs">{user?.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                  <div
                    onClick={() => onTabChange('profile')}
                    className="flex items-center space-x-2 min-w-0 cursor-pointer hover:bg-slate-800/60 p-1.5 rounded-lg transition-all"
                  >
                    {user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-medium text-slate-300 shrink-0">
                        {user?.name?.[0] || 'S'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{user?.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-500 hover:text-slate-300 cursor-pointer shrink-0 transition-colors"
                    title="Log out"
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
                  className="w-full p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer flex items-center justify-center"
                  title="Login / Sign Up"
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onTabChange('auth')} className="py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer text-center">
                    Login
                  </button>
                  <button onClick={() => onTabChange('auth')} className="py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer text-center">
                    Sign up
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </aside>

      {/* 2. TOP COMMAND NAVBAR */}
      <header
        className="sticky top-0 z-30 h-14 border-b border-slate-800/60 px-4 sm:px-6 flex items-center justify-between bg-[#0A0E14] transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <div
          onClick={() => onTabChange('dashboard')}
          className="flex items-center xl:hidden cursor-pointer"
        >
          <BrandLogo size="xs" showText={true} />
        </div>

        <div className="hidden xl:flex items-center space-x-3">
          <h1 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            {getHeaderTitle().icon}
            <span>{getHeaderTitle().title}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer hidden sm:flex items-center gap-2"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs text-slate-500 font-medium">Ctrl+K</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title={theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
              aria-label="Toggle dark/light theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}


          {isPremium ? (
            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hidden sm:flex items-center gap-1">
              Pro
            </span>
          ) : (
            <button
              onClick={onOpenUpgrade}
              className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-all cursor-pointer hidden sm:block"
            >
              Upgrade
            </button>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={onNotificationToggle}
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white relative cursor-pointer focus:outline-hidden transition-colors"
                title="Notifications"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[360px]">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <span className="text-xs font-semibold text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
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
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-800/60 ${!notif.isRead ? 'bg-slate-800/50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-slate-200">{notif.title}</span>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">{notif.message}</p>
                        <span className="text-xs text-slate-500 mt-1.5 block">
                          {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        Nothing here yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <button
              onClick={() => onTabChange('auth')}
              className="xl:hidden px-3 py-1.5 bg-slate-800/60 text-white rounded-lg text-xs font-medium"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0E14]/95 backdrop-blur-lg border-t border-slate-800/60 py-2 px-2 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={isActive ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</div>
              <span className="text-xs mt-1 tracking-tight truncate max-w-[64px]">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />}
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-500 hover:text-slate-300"
        >
          <Menu className="w-4 h-4" />
          <span className="text-xs mt-1">More</span>
        </button>
      </nav>

      {/* Mobile More Drawer Sheet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-3">
          <div className="bg-[#0F1218] border border-slate-700/60 w-full max-w-lg rounded-2xl p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="font-semibold text-sm text-white">
                Menu
              </div>
              <div className="flex items-center gap-2">
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs px-2.5 transition-colors cursor-pointer"
                    title={theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode'}
                  >
                    {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                  </button>
                )}
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setIsMobileMenuOpen(false); }}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                    activeTab === item.id ? 'bg-blue-500/10 border-blue-500/20 text-white font-medium' : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
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
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-medium text-slate-300 shrink-0">
                      {user?.name?.[0] || 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-300 cursor-pointer shrink-0 transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {!isPremium && (
              <button onClick={() => { setIsMobileMenuOpen(false); onOpenUpgrade(); }} className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-white font-medium rounded-xl text-xs cursor-pointer">
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN PAGE CONTENT ARENA */}
      <main
        className="flex-1 flex flex-col pb-20 xl:pb-0 min-h-[calc(100vh-3.5rem)] transition-[padding-left] duration-300 ease-in-out"
        style={{ paddingLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <div className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1">
          {children}
        </div>
      </main>

      <FloatingTimer />

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onTabChange}
      />
    </div>
  );
}
