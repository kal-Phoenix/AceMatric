let accessToken: string | null = null;

const listeners = new Set<() => void>();

// Token refresh: 15 min expiry, refresh at 13 min
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
const REFRESH_BEFORE_MS = 2 * 60 * 1000;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  listeners.forEach(fn => fn());
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (token) {
    scheduleRefresh();
  }
  notify();
}

export function onAccessTokenChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const refreshAt = ACCESS_TOKEN_MS - REFRESH_BEFORE_MS;
  refreshTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.token) {
        setAccessToken(data.token);
      }
    } catch {
      // Will retry on next API call
    }
  }, refreshAt);
}

export async function restoreTokenFromCookie(): Promise<string | null> {
  if (accessToken) return accessToken;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.token) {
      setAccessToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

// Global fetch interceptor: auto-refresh on 401
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const res = await originalFetch.call(this, input, init);

    if (res.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await originalFetch.call(this, '/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.success && data.token) {
            setAccessToken(data.token);
            pendingQueue.forEach(cb => cb());
            pendingQueue = [];
          }
        }
      } catch {
        // Refresh failed
      } finally {
        isRefreshing = false;
      }
    }

    return res;
  };
}
