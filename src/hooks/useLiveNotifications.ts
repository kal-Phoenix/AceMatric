import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../lib/authToken';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export function useLiveNotifications(
  userEmail: string | undefined,
  onToast: (message: string, type?: 'success' | 'info' | 'warning') => void
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(userEmail)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newItems = data.filter((n: Notification) => !existingIds.has(n.id));
          if (newItems.length === 0) return data;
          return [...newItems, ...prev];
        });
      }
    } catch (e) {
      console.warn('Failed fetching notifications:', e);
    }
  }, [userEmail]);

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    try {
      const token = getAccessToken();
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.warn('Failed marking notification read:', e);
    }
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!userEmail) return;
    try {
      const token = getAccessToken();
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: userEmail })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onToastRef.current('All notifications marked as read', 'success');
    } catch (e) {
      console.warn('Failed marking all notifications read:', e);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket connection for live notifications
  useEffect(() => {
    if (!userEmail) return;

    const token = getAccessToken();
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let reconnectAttempts = 0;
    let destroyed = false;
    const MAX_RECONNECT_ATTEMPTS = 20;

    function connect() {
      if (destroyed || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
      if (socket) {
        try { socket.close(); } catch {}
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsPort = window.location.port === '5173' ? '3000' : (window.location.port || '3000');
      const socketUrl = `${protocol}//${host}:${wsPort}`;

      try {
        socket = new WebSocket(socketUrl);
      } catch {
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        reconnectAttempts = 0;
        const currentToken = getAccessToken();
        if (!currentToken) {
          socket?.close();
          return;
        }
        socket?.send(JSON.stringify({
          type: 'register',
          token: currentToken
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_notification') {
            setNotifications(prev => [data.notification, ...prev]);
            onToastRef.current(`\uD83D\uDD14 Live Notice: ${data.notification.title}`, 'success');
          }
        } catch (err) {
          console.error('Global Notification parser error:', err);
        }
      };

      socket.onclose = () => {
        if (destroyed) return;
        scheduleReconnect();
      };

      socket.onerror = () => {};
    }

    function scheduleReconnect() {
      if (destroyed) return;
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);
      reconnectTimeout = setTimeout(connect, delay);
    }

    const connectTimeout = setTimeout(connect, 1000);

    return () => {
      destroyed = true;
      clearTimeout(connectTimeout);
      if (socket) {
        try { socket.close(); } catch {}
      }
      clearTimeout(reconnectTimeout);
    };
  }, [userEmail]);

  // Pause polling when tab is hidden
  useEffect(() => {
    let pollInterval: any = null;

    function startPolling() {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        }
      }, 30000);
    }

    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (document.visibilityState === 'visible') startPolling();

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    isNotificationOpen,
    setIsNotificationOpen,
    unreadCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  };
}
