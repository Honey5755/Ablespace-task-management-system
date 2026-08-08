'use client';

import { ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PriorityBadge } from '@/components/priority';
import { TaskRowActions } from '@/components/task-row-actions';
import { MemberCell } from '@/components/ui/avatar';
import { formatDate, isOverdue } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';

/** Column visibility, driven by the Fields dropdown. */
export interface VisibleFields {
  priority: boolean;
  members: boolean;
  dueDate: boolean;
  labels: boolean;
  status: boolean;
}

export const DEFAULT_FIELDS: VisibleFields = {
  priority: true,
  members: true,
  dueDate: true,
  labels: false,
  status: false,
};

interface TaskGroupProps {
  status: TaskStatus;
  tasks: Task[];
  fields: VisibleFields;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
  onDeleteTask: (task: Task) => void;
}

export function TaskGroup({
  status,
  tasks,
  fields,
  onAddTask,
  onEditTask,
  onStatusChange,
  onPriorityChange,
  onDeleteTask,
}: TaskGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const groupId = `group-${status}`;

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={groupId}
        className="mb-1.5 flex items-center gap-1 rounded-md py-0.5 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ChevronRight
          className={cn('size-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')}
        />
        {/* No count badge here: the design's group headers show the caret and
            label only. */}
        <span className="font-medium">{STATUS_LABELS[status]}</span>
      </button>

      {isOpen && (
        <div id={groupId} className="overflow-hidden rounded-lg border border-border">
          {/* Header row — hidden on mobile, where rows become stacked cards. */}
          <div className="hidden bg-muted/60 sm:flex">
            <HeaderCell className="flex-1">Task</HeaderCell>
            {fields.status && <HeaderCell className="w-28 shrink-0">Status</HeaderCell>}
            {fields.priority && <HeaderCell className="w-32 shrink-0">Priority</HeaderCell>}
            {fields.labels && <HeaderCell className="w-40 shrink-0">Labels</HeaderCell>}
            {fields.members && <HeaderCell className="w-24 shrink-0">Members</HeaderCell>}
            {fields.dueDate && <HeaderCell className="w-32 shrink-0">Due Date</HeaderCell>}
            <HeaderCell className="w-20 shrink-0 text-right">Actions</HeaderCell>
          </div>

          {tasks.length === 0 ? (
            <p className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No tasks in {STATUS_LABELS[status]}.
            </p>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                fields={fields}
                onEdit={() => onEditTask(task)}
                onStatusChange={(next) => onStatusChange(task, next)}
                onPriorityChange={(next) => onPriorityChange(task, next)}
                onDelete={() => onDeleteTask(task)}
              />
            ))
          )}

          {/* Footer row — present on every group, as drawn. */}
          <button
            type="button"
            onClick={() => onAddTask(status)}
            className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
          >
            <Plus className="size-3.5" />
            Add Task
          </button>
        </div>
      )}
    </section>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-2.5 text-sm font-medium text-foreground', className)}>{children}</div>
  );
}

function TaskRow({
  task,
  fields,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: {
  task: Task;
  fields: VisibleFields;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="relative flex flex-col border-t border-border transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 px-4 py-2.5">
        <Link
          href={`/tasks/${task.id}`}
          className="truncate text-sm transition-colors hover:text-accent hover:underline"
        >
          {task.title}
        </Link>
        {task._count.subtasks > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {task._count.subtasks} subtask{task._count.subtasks === 1 ? '' : 's'}
          </span>
        )}

        {/* Mobile-only meta line: the design has no small-screen frame, so the
            columns fold into a summary rather than scrolling sideways. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
          {fields.priority && <PriorityBadge priority={task.priority} className="text-xs" />}
          {fields.dueDate && task.dueDate && (
            <span className={cn(overdue && 'text-destructive')}>{formatDate(task.dueDate)}</span>
          )}
          {fields.members && task.assignee && <span>{task.assignee.name}</span>}
        </div>
      </div>

      {fields.status && (
        <div className="hidden w-28 shrink-0 px-4 text-sm text-muted-foreground sm:block">
          {STATUS_LABELS[task.status]}
        </div>
      )}

      {fields.priority && (
        <div className="hidden w-32 shrink-0 px-4 sm:block">
          <PriorityBadge priority={task.priority} />
        </div>
      )}

      {fields.labels && (
        <div className="hidden w-40 shrink-0 gap-1 overflow-hidden px-4 sm:flex">
          {task.labels.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="truncate rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
          )}
        </div>
      )}

      {fields.members && (
        <div className="hidden w-24 shrink-0 px-4 sm:block">
          <MemberCell user={task.assignee} />
        </div>
      )}

      {fields.dueDate && (
        <div
          className={cn(
            'hidden w-32 shrink-0 px-4 text-sm sm:block',
            overdue ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {formatDate(task.dueDate) || '—'}
        </div>
      )}

      <div className="absolute right-2 top-2 sm:static sm:w-20 sm:shrink-0 sm:px-4 sm:text-right">
        <TaskRowActions
          task={task}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
