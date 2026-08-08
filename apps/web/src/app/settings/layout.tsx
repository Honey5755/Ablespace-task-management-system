'use client';

import { ArrowLeft, Palette, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SETTINGS_NAV = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/theme', label: 'Theme', icon: Sun },
  { href: '/settings/color', label: 'Color', icon: Palette },
];

/** Settings is a separate full-page view with its own sidebar, as designed. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState('');

  const items = SETTINGS_NAV.filter((item) =>
    item.label.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <AuthGate>
      <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
        <aside className="shrink-0 border-b border-border p-3 lg:w-[240px] lg:border-b-0 lg:border-r">
          <Link
            href="/tasks"
            className="mb-3 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to app
          </Link>

          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search"
            aria-label="Search settings"
            className="mb-2 h-8"
          />

          <nav className="flex flex-row gap-0.5 overflow-x-auto lg:flex-col">
            {items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
            {items.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches</p>
            )}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </AuthGate>
  );
}
