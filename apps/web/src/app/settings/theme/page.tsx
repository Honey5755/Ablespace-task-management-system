'use client';

import { Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEMES, useTheme, type Theme } from '@/providers/theme-provider';

const THEME_META: Record<Theme, { label: string; icon: typeof Sun; description: string }> = {
  light: { label: 'Light', icon: Sun, description: 'Bright surfaces with dark text.' },
  dark: { label: 'Dark', icon: Moon, description: 'Dark surfaces with light text.' },
};

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">Theme</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose how Pyramid looks. Your choice is saved to this browser.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((option) => {
          const { label, icon: Icon, description } = THEME_META[option];
          const isActive = theme === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              aria-pressed={isActive}
              className={cn(
                'group flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isActive ? 'border-accent' : 'border-border hover:border-foreground/30',
              )}
            >
              {/* Miniature of the app shell, painted in the option's own palette
                  rather than the active one, so both previews read correctly. */}
              <span
                className={cn(
                  'flex h-24 gap-1.5 overflow-hidden rounded-lg border p-1.5',
                  option === 'dark'
                    ? 'border-neutral-800 bg-neutral-950'
                    : 'border-neutral-200 bg-white',
                )}
              >
                <span
                  className={cn(
                    'flex w-1/4 flex-col gap-1 rounded p-1',
                    option === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100',
                  )}
                >
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className={cn(
                        'h-1.5 rounded-full',
                        option === 'dark' ? 'bg-neutral-700' : 'bg-neutral-300',
                      )}
                    />
                  ))}
                </span>
                <span className="flex flex-1 flex-col gap-1 p-1">
                  {[0, 1, 2, 3].map((line) => (
                    <span
                      key={line}
                      className={cn(
                        'h-1.5 rounded-full',
                        line === 0 ? 'w-1/2' : 'w-full',
                        option === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200',
                      )}
                    />
                  ))}
                </span>
              </span>

              <span className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{label}</span>
                {isActive && <Check className="ml-auto size-4 text-accent" />}
              </span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        The Figma menu offers Light and Dark only, so no “System” option is provided.
      </p>
    </>
  );
}
