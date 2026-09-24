import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import {ThemeProvider} from './lib/ThemeContext.tsx';
import {AuthProvider} from './lib/AuthContext.tsx';
import {setupFetchInterceptor} from './lib/authToken.ts';
import {logger} from './lib/logger.ts';
import './index.css';

// Auto-refresh tokens on 401 responses
setupFetchInterceptor();

// Register Service Worker for push notifications
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      logger.error('Service worker registration failed', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
