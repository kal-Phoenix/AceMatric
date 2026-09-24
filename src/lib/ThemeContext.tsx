import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  syncFromProfile: (isDarkMode: boolean | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('acematric-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const syncFromProfile = useCallback((isDarkMode: boolean | undefined) => {
    // Only sync if the profile has an explicit preference (not undefined/null)
    // This prevents overriding the user's localStorage choice on login
    if (isDarkMode === undefined || isDarkMode === null) return;
    const next = isDarkMode ? 'dark' : 'light';
    setTheme(prev => {
      try { localStorage.setItem('acematric-theme', next); } catch {}
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('acematric-theme', next); } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', syncFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
