import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  /** Whether the theme toggle is currently active (only on chatbot pages) */
  isChatbot: boolean;
  setIsChatbot: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isChatbot, setIsChatbot] = useState(false);
  const [chatTheme, setChatTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('astar-chat-theme');
    return (stored as Theme) || 'light';
  });

  // The effective theme: dark only when on chatbot AND user chose dark
  const theme: Theme = isChatbot ? chatTheme : 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('astar-chat-theme', chatTheme);
  }, [chatTheme]);

  const toggleTheme = useCallback(() => {
    setChatTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isChatbot, setIsChatbot }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
