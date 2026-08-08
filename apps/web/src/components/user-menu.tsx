'use client';

import { ChevronsUpDown, Moon, Settings, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  ACCENT_LABELS,
  ACCENT_SWATCHES,
  ACCENTS,
  useTheme,
  type Accent,
} from '@/providers/theme-provider';

/**
 * The sidebar's user switcher. Opens the menu drawn in the Figma frames:
 * a profile header, then Change Theme ▸, Color Mode ▸ and Settings.
 */
export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, accent, setTheme, setAccent } = useTheme();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        )}
      >
        <Avatar className="size-6">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="flex-1 truncate font-medium">{user.name}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <div className="flex flex-col items-center gap-1 px-2 py-3">
          <Avatar className="size-12">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="text-sm">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="mt-1 text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {user.email ?? (user.isGuest ? 'Guest session' : '')}
          </span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="text-muted-foreground" />
            Change Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuCheckItem checked={theme === 'light'} onSelect={() => setTheme('light')}>
                <Sun className="text-muted-foreground" />
                Light
              </DropdownMenuCheckItem>
              <DropdownMenuCheckItem checked={theme === 'dark'} onSelect={() => setTheme('dark')}>
                <Moon className="text-muted-foreground" />
                Dark
              </DropdownMenuCheckItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span
              className="size-4 shrink-0 rounded-sm"
              style={{ backgroundColor: ACCENT_SWATCHES[accent] }}
            />
            Color Mode
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuLabel>Color Mode</DropdownMenuLabel>
              {ACCENTS.map((option: Accent) => (
                <DropdownMenuCheckItem
                  key={option}
                  checked={accent === option}
                  onSelect={() => setAccent(option)}
                >
                  <span
                    className="size-4 shrink-0 rounded-sm"
                    style={{ backgroundColor: ACCENT_SWATCHES[option] }}
                  />
                  {ACCENT_LABELS[option]}
                </DropdownMenuCheckItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuItem onSelect={() => router.push('/settings/profile')}>
          <Settings className="text-muted-foreground" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact theme toggle used on the Settings pages' own header. */
export function ThemeQuickToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
