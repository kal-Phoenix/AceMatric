// Central Sentry wiring — loaded lazily so the SDK only costs anything when a
// DSN is configured. captureException() is safe to call at any time.
let SentryModule: typeof import('@sentry/node') | null = null;
let initializing = false;

export function initSentry(dsn: string | undefined): void {
  if (!dsn || dsn === 'your-sentry-dsn') return;
  if (SentryModule || initializing) return;
  initializing = true;

  import('@sentry/node')
    .then((mod) => {
      mod.init({ dsn, tracesSampleRate: 0.1 });
      SentryModule = mod;
      console.log('[sentry] Error tracking initialized');
    })
    .catch(() => {
      initializing = false;
      console.warn('[sentry] Failed to initialize — errors will only be logged to console');
    });
}

export function captureException(err: unknown, extraContext?: Record<string, unknown>): void {
  try {
    if (!SentryModule) return;
    if (extraContext) {
      SentryModule.withScope((scope) => {
        scope.setExtras(extraContext);
        SentryModule!.captureException(err);
      });
    } else {
      SentryModule.captureException(err);
    }
  } catch {
    // error reporting must never break request handling
  }
}

// Used by fatal process handlers, where the event must be flushed before exit.
export async function captureExceptionAndFlush(err: unknown): Promise<void> {
  captureException(err);
  try {
    await SentryModule?.flush(2000);
  } catch {
    // ignore — we're shutting down anyway
  }
}
