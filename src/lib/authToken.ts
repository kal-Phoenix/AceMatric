let accessToken: string | null = null;

// Token refresh: 15 min expiry, refresh at 13 min
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
const REFRESH_BEFORE_MS = 2 * 60 * 1000;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

// The server rotates refresh tokens (old one is revoked as soon as a new one is
// issued), so concurrent refresh calls race: the loser gets 401 and the session
// is dropped. Every refresh path shares this single in-flight promise.
let refreshInFlight: Promise<string | null> | null = null;

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
}

async function requestRefresh(): Promise<string | null> {
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

export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const refreshAt = ACCESS_TOKEN_MS - REFRESH_BEFORE_MS;
  refreshTimer = setTimeout(() => {
    refreshSession();
  }, refreshAt);
}

export async function restoreTokenFromCookie(): Promise<string | null> {
  if (accessToken) return accessToken;
  return refreshSession();
}

export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const res = await originalFetch.call(this, input, init);

    // Only worth refreshing when we already hold a token (otherwise the caller
    // is unauthenticated and the 401 is expected).
    if (res.status === 401 && accessToken) {
      await refreshSession();
    }

    return res;
  };
}
