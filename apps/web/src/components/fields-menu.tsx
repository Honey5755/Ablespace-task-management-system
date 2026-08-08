'use client';

import { Columns3, LayoutList, SlidersHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { VisibleFields } from '@/components/task-group';

export type ViewMode = 'list' | 'board';

const FIELD_ROWS: { key: keyof VisibleFields; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'members', label: 'Members' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'labels', label: 'Labels' },
  { key: 'status', label: 'Status' },
];

/**
 * The `Fields` dropdown: a List/Board view toggle above column-visibility
 * checkboxes.
 *
 * Two deliberate departures from the frame, both documented in the README:
 * "Members" is drawn twice (a duplicate control would read as our bug), and
 * "Reporter" is omitted because the data model has no reporter distinct from
 * the owner in a single-member guest workspace.
 */
export function FieldsMenu({
  fields,
  onFieldsChange,
  view,
  onViewChange,
}: {
  fields: VisibleFields;
  onFieldsChange: (fields: VisibleFields) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-sm transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        )}
      >
        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
        <span className="hidden sm:inline">Fields</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="mb-1 grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5">
          {(
            [
              { key: 'list', label: 'List', icon: LayoutList },
              { key: 'board', label: 'Board', icon: Columns3 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              aria-pressed={view === key}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
                view === key
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />

        {FIELD_ROWS.map(({ key, label }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            {label}
            <Checkbox
              checked={fields[key]}
              onCheckedChange={(checked) =>
                onFieldsChange({ ...fields, [key]: checked === true })
              }
            />
          </label>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
