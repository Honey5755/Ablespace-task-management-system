'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ACCENT_LABELS,
  ACCENT_SWATCHES,
  ACCENTS,
  useTheme,
  type Accent,
} from '@/providers/theme-provider';

export default function ColorSettingsPage() {
  const { accent, setAccent } = useTheme();

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">Color</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sets the accent used for links, active navigation and focus rings.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACCENTS.map((option: Accent) => {
          const isActive = accent === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setAccent(option)}
              aria-pressed={isActive}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isActive ? 'border-accent' : 'border-border hover:border-foreground/30',
              )}
            >
              <span
                className="size-6 shrink-0 rounded-md"
                style={{ backgroundColor: ACCENT_SWATCHES[option] }}
              />
              <span className="text-sm font-medium">{ACCENT_LABELS[option]}</span>
              {isActive && <Check className="ml-auto size-4 text-accent" />}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        The design labels the violet swatch “Blue”; the drawn colour is kept so the
        palette matches the Figma frame.
      </p>
    </>
  );
}
