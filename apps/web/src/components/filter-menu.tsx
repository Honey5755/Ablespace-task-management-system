'use client';

import { ListFilter, X } from 'lucide-react';
import { PriorityIcon } from '@/components/priority';
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
import { cn } from '@/lib/utils';
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  TASK_STATUSES,
  type Label,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';

export interface TaskFilters {
  status: TaskStatus[];
  priority: TaskPriority[];
  labelId: string[];
}

export const EMPTY_FILTERS: TaskFilters = { status: [], priority: [], labelId: [] };

export const countFilters = (filters: TaskFilters): number =>
  filters.status.length + filters.priority.length + filters.labelId.length;

/** Multi-select facets: Status, Priority and Labels, each as a submenu. */
export function FilterMenu({
  filters,
  onFiltersChange,
  labels,
}: {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  labels: Label[];
}) {
  const active = countFilters(filters);

  const toggle = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K][number],
  ): void => {
    const current = filters[key] as string[];
    const next = current.includes(value as string)
      ? current.filter((item) => item !== value)
      : [...current, value as string];
    onFiltersChange({ ...filters, [key]: next });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Filter tasks"
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-sm transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          active > 0 && 'border-accent text-accent',
        )}
      >
        <ListFilter className={cn('size-3.5', active === 0 && 'text-muted-foreground')} />
        {active > 0 && <span className="text-xs font-medium">{active}</span>}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {TASK_STATUSES.map((status) => (
                <DropdownMenuCheckItem
                  key={status}
                  checked={filters.status.includes(status)}
                  // Keep the menu open so several facets can be picked at once.
                  onSelect={(event) => {
                    event.preventDefault();
                    toggle('status', status);
                  }}
                >
                  {STATUS_LABELS[status]}
                </DropdownMenuCheckItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {PRIORITY_ORDER.map((priority) => (
                <DropdownMenuCheckItem
                  key={priority}
                  checked={filters.priority.includes(priority)}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggle('priority', priority);
                  }}
                >
                  <PriorityIcon priority={priority} />
                  {PRIORITY_LABELS[priority]}
                </DropdownMenuCheckItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuLabel>Labels</DropdownMenuLabel>
              {labels.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">No labels</p>
              ) : (
                labels.map((label) => (
                  <DropdownMenuCheckItem
                    key={label.id}
                    checked={filters.labelId.includes(label.id)}
                    onSelect={(event) => {
                      event.preventDefault();
                      toggle('labelId', label.id);
                    }}
                  >
                    {label.name}
                  </DropdownMenuCheckItem>
                ))
              )}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {active > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onFiltersChange(EMPTY_FILTERS)}>
              <X className="text-muted-foreground" />
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
