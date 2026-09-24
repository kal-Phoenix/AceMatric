const isDev = import.meta.env.DEV;

export const logger = {
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    if (isDev) {
      console.error(`[AceMatric] ${message}`, error, context);
    }
    // In production, this could send to Sentry or another error tracking service
  },

  warn(message: string, context?: Record<string, unknown>) {
    if (isDev) {
      console.warn(`[AceMatric] ${message}`, context);
    }
  },

  info(message: string, context?: Record<string, unknown>) {
    if (isDev) {
      console.log(`[AceMatric] ${message}`, context);
    }
  },
};
