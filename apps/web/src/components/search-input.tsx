'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Collapsed to an icon until invoked, then expands into an input with the ⌘F
 * badge from the design. ⌘F / Ctrl+F opens it and Escape closes it.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsOpen(true);
        // Focus after the input has actually mounted.
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const close = (): void => {
    setIsOpen(false);
    onChange('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Search tasks"
        onClick={() => {
          setIsOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md border border-border transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          value && 'border-accent text-accent',
        )}
      >
        <Search className={cn('size-3.5', !value && 'text-muted-foreground')} />
      </button>
    );
  }

  return (
    <div className="relative flex h-8 min-w-0 flex-1 items-center rounded-md border border-border focus-within:ring-2 focus-within:ring-ring/40 sm:w-64 sm:flex-none">
      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && close()}
        placeholder={placeholder}
        aria-label="Search tasks"
        className="h-full w-full bg-transparent pl-8 pr-16 text-sm outline-none placeholder:text-muted-foreground"
      />
      {value ? (
        <button
          type="button"
          onClick={close}
          aria-label="Clear search"
          className="absolute right-2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘F
        </kbd>
      )}
    </div>
  );
}
