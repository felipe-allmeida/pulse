import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  const handleClick = () => {
    toggle();
    const next = useThemeStore.getState().theme;
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={handleClick}>
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
