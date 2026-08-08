'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';

/** The `⋯` cell in the Actions column. */
export function TaskRowActions({
  task,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: {
  task: Task;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${task.title}`}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="text-muted-foreground" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {TASK_STATUSES.map((status) => (
                <DropdownMenuCheckItem
                  key={status}
                  checked={task.status === status}
                  onSelect={() => onStatusChange(status)}
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
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {PRIORITY_ORDER.map((priority) => (
                <DropdownMenuCheckItem
                  key={priority}
                  checked={task.priority === priority}
                  onSelect={() => onPriorityChange(priority)}
                >
                  <PriorityIcon priority={priority} />
                  {PRIORITY_LABELS[priority]}
                </DropdownMenuCheckItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
