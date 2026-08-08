'use client';

import { ChevronDown, LayoutGrid, PanelLeft, Package, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UserMenu } from '@/components/user-menu';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/tasks', label: 'Tasks', icon: LayoutGrid },
  { href: '/projects', label: 'Projects', icon: Package },
];

interface ShellContextValue {
  /** Desktop: sidebar collapsed to icons. Mobile: off-canvas drawer open. */
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) throw new Error('useShell must be used within AppShell');
  return context;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      <p className="flex items-center gap-1 px-2 py-1.5 text-xs font-normal text-muted-foreground">
        Workspace
        <ChevronDown className="size-3" />
      </p>

      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              isActive
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setIsSidebarOpen((open) => !open), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // The drawer is route-scoped on mobile; a navigation should dismiss it.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Escape closes the drawer, matching the dialog conventions elsewhere.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  const value = useMemo(
    () => ({ isSidebarOpen, toggleSidebar, closeSidebar }),
    [isSidebarOpen, toggleSidebar, closeSidebar],
  );

  return (
    <ShellContext.Provider value={value}>
      <div className="flex min-h-dvh bg-background">
        {/* Desktop sidebar — always present from lg up. */}
        <aside className="hidden w-[240px] shrink-0 flex-col gap-2 border-r border-border py-2 lg:flex">
          <div className="px-2">
            <UserMenu />
          </div>
          <SidebarNav />
        </aside>

        {/* Mobile drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={closeSidebar}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[260px] flex-col gap-2 border-r border-border bg-background py-2 shadow-xl">
              <div className="flex items-center gap-1 px-2">
                <div className="flex-1">
                  <UserMenu />
                </div>
                <button
                  type="button"
                  onClick={closeSidebar}
                  aria-label="Close navigation"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <SidebarNav onNavigate={closeSidebar} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}

/**
 * Page header. `title` sits left with optional breadcrumbs; `actions` holds the
 * search / Fields / filter / Add cluster from the design.
 */
export function PageHeader({
  title,
  breadcrumbs,
  actions,
}: {
  title: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  const { toggleSidebar } = useShell();

  return (
    <>
      <div className="flex h-12 items-center gap-2 border-b border-border px-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <PanelLeft className="size-4" />
        </button>
        <span className="hidden rounded-md p-1.5 text-muted-foreground lg:block">
          <PanelLeft className="size-4" />
        </span>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="text-border">|</span>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <span className="text-muted-foreground">›</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <h1 className="flex-1 truncate text-base font-semibold tracking-tight">{title}</h1>
        {actions}
      </div>
    </>
  );
}
