import { ReactNode, useState } from 'react';
import {
  BarChart3,
  GraduationCap,
  Target,
  Clock,
  Trophy,
  Users,
  Zap,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Sun,
  Moon,
  X,
  ChevronRight,
  Award,
} from 'lucide-react';
import { Stream } from '../types';
import FloatingTimer from './FloatingTimer';
import BrandLogo from './ui/BrandLogo';

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

// Primary 5 bottom-tab items (icons only + short label)
const PRIMARY_TAB_IDS = ['dashboard', 'study', 'practice', 'simulator', 'leaderboard'];

export default function MobileShell({
  children,
  navItems,
  activeTab,
  onTabChange,
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

  const primaryTabs = navItems.filter(n => PRIMARY_TAB_IDS.includes(n.id));
  const moreTabs = navItems.filter(n => !PRIMARY_TAB_IDS.includes(n.id));

  const activeIsPrimary = PRIMARY_TAB_IDS.includes(activeTab);

  const handleTabSelect = (id: string) => {
    onTabChange(id);
    setIsDrawerOpen(false);
  };

  return (
    <div
      className="flex flex-col w-full min-h-screen overflow-x-hidden"
      style={{ background: '#0A0E14', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── TOP HEADER ─────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 52,
          background: 'rgba(10,14,20,0.97)',
          borderBottom: '1px solid rgba(51,65,85,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: Logo */}
        <div onClick={() => handleTabSelect('dashboard')} style={{ cursor: 'pointer' }}>
          <BrandLogo size="xs" showText={true} />
        </div>

        {/* Right: action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              style={iconBtnStyle}
              aria-label="Toggle theme"
            >
              {theme === 'light'
                ? <Moon style={{ width: 16, height: 16, color: '#64748b' }} />
                : <Sun style={{ width: 16, height: 16, color: '#fbbf24' }} />
              }
            </button>
          )}

          {!isPremium && (
            <button
              onClick={onOpenUpgrade}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa', fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Zap style={{ width: 12, height: 12 }} />
              Pro
            </button>
          )}

          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={onNotificationToggle}
                style={{ ...iconBtnStyle, position: 'relative' }}
                aria-label="Notifications"
              >
                <Bell style={{ width: 17, height: 17, color: '#94a3b8' }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 40,
                  width: 'min(320px, calc(100vw - 28px))',
                  background: '#0F1218',
                  border: '1px solid #1e293b',
                  borderRadius: 14,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  maxHeight: 340,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: '1px solid #1e293b', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={onMarkAllNotificationsRead} style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0
                      ? <div style={{ padding: '24px 14px', textAlign: 'center', color: '#475569', fontSize: 12 }}>Nothing here yet.</div>
                      : notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => { onMarkNotificationRead(n.id); if (n.actionUrl) onNotificationAction(n.actionUrl); onNotificationToggle(); }}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid rgba(30,41,59,0.6)',
                              cursor: 'pointer',
                              background: !n.isRead ? 'rgba(30,41,59,0.5)' : 'transparent',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{n.title}</span>
                              {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0, marginTop: 4 }} />}
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Avatar / login */}
          {user ? (
            <div onClick={() => handleTabSelect('profile')} style={{ cursor: 'pointer' }}>
              {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '2px solid #1e293b' }} />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#e2e8f0',
                  border: '2px solid #334155',
                }}>
                  {user.name?.[0] || 'S'}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleTabSelect('auth')}
              style={{
                padding: '4px 10px', borderRadius: 8,
                background: '#1e293b', border: '1px solid #334155',
                color: '#e2e8f0', fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────────── */}
      <main style={{
        flex: 1,
        overflowX: 'hidden',
        paddingBottom: 72, // space for bottom nav
        minHeight: 0,
      }}>
        <div style={{ padding: '12px 12px 0' }}>
          {children}
        </div>
      </main>

      {/* ── BOTTOM TAB BAR ─────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 60,
        background: 'rgba(10,14,20,0.97)',
        borderTop: '1px solid rgba(51,65,85,0.5)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {primaryTabs.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 2px 4px',
                position: 'relative',
                color: isActive ? '#60a5fa' : '#475569',
                transition: 'color 0.15s',
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28, height: 2,
                  borderRadius: 2,
                  background: '#3b82f6',
                }} />
              )}
              <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 500, lineHeight: 1, letterSpacing: 0.2 }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* "More" button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 2px 4px',
            color: !activeIsPrimary ? '#60a5fa' : '#475569',
            position: 'relative',
          }}
        >
          {!activeIsPrimary && (
            <span style={{
              position: 'absolute',
              top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 28, height: 2,
              borderRadius: 2,
              background: '#3b82f6',
            }} />
          )}
          {/* 3-dot icon */}
          <span style={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 3.5, height: 3.5,
                borderRadius: '50%',
                background: !activeIsPrimary ? '#60a5fa' : '#475569',
              }} />
            ))}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 500, lineHeight: 1, letterSpacing: 0.2, marginTop: 2 }}>
            More
          </span>
        </button>
      </nav>

      {/* ── MORE DRAWER ────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: '#0F1218',
              borderTop: '1px solid #1e293b',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#334155' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 16px 10px',
              borderBottom: '1px solid rgba(51,65,85,0.5)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>More</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 8,
                      background: '#1e293b', border: '1px solid #334155',
                      color: '#94a3b8', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {theme === 'light' ? <Moon style={{ width: 13, height: 13 }} /> : <Sun style={{ width: 13, height: 13, color: '#fbbf24' }} />}
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </button>
                )}
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ ...iconBtnStyle }}
                  aria-label="Close"
                >
                  <X style={{ width: 16, height: 16, color: '#64748b' }} />
                </button>
              </div>
            </div>

            {/* Nav items */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
              {moreTabs.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      marginBottom: 4,
                      background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                      border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: isActive ? '#60a5fa' : '#64748b', flexShrink: 0, display: 'flex' }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? '#fff' : '#cbd5e1', flex: 1 }}>
                      {item.fullLabel || item.label}
                    </span>
                    {isActive && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                    )}
                    {!isActive && <ChevronRight style={{ width: 15, height: 15, color: '#334155', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* User section */}
            {user && (
              <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(51,65,85,0.5)' }}>
                <div
                  onClick={() => handleTabSelect('profile')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: '#141920',
                    border: '1px solid #1e293b',
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) ? (
                    <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#e2e8f0',
                    }}>
                      {user.name?.[0] || 'S'}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onLogout(); setIsDrawerOpen(false); }}
                    style={{ ...iconBtnStyle, flexShrink: 0 }}
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut style={{ width: 16, height: 16, color: '#64748b' }} />
                  </button>
                </div>

                {!isPremium && (
                  <button
                    onClick={() => { setIsDrawerOpen(false); onOpenUpgrade(); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Zap style={{ width: 14, height: 14 }} />
                    Upgrade to Pro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <FloatingTimer />
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  padding: 0,
};
