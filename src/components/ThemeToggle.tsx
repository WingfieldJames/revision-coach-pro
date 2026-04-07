import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme, isChatbot } = useTheme();

  // Only render on chatbot pages
  if (!isChatbot) return null;

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-[11rem] right-6 z-[9998] w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-elevated hover:scale-105 transition-all duration-200 pointer-events-auto cursor-pointer"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-foreground" />
      ) : (
        <Sun className="w-4 h-4 text-foreground" />
      )}
    </button>
  );
}
