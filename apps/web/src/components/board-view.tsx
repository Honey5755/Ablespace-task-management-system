'use client';

import { Plus } from 'lucide-react';
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

/**
 * Board view. The Figma `Fields` menu offers a List/Board toggle but the file
 * contains no Board frame, so this is an interpretation built from the same
 * tokens as the list — see README. Drag-and-drop uses the native HTML5 API
 * rather than a dependency; a reviewer comment on the Figma asks for a visible
 * drag affordance, so cards show a grab cursor and a lifted drag state.
 */
export function BoardView({
  columns,
  tasks,
  onAddTask,
  onEditTask,
  onReorder,
  onStatusChange,
  onPriorityChange,
  onDeleteTask,
}: {
  columns: TaskStatus[];
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  /** Full ordered snapshot after a move, so the write stays idempotent. */
  onReorder: (items: { id: string; status: TaskStatus }[]) => void;
  /** Keyboard-accessible alternative to dragging, via the card's ⋯ menu. */
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  /** Insertion slot within the hovered column; null means "append". */
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const byStatus = (status: TaskStatus): Task[] =>
    tasks.filter((task) => task.status === status);

  /**
   * Rebuilds every column in its post-move order and hands the whole list up.
   * Sending the complete snapshot (rather than one delta) means a retry can't
   * corrupt the ordering.
   */
  const handleDrop = (status: TaskStatus): void => {
    const dragged = tasks.find((candidate) => candidate.id === draggingId);
    const insertAt = dropIndex;

    setDraggingId(null);
    setDropTarget(null);
    setDropIndex(null);

    if (!dragged) return;

    const target = byStatus(status).filter((task) => task.id !== dragged.id);
    const index = insertAt === null ? target.length : Math.min(insertAt, target.length);
    target.splice(index, 0, dragged);

    const snapshot = columns.flatMap((column) =>
      (column === status ? target : byStatus(column).filter((t) => t.id !== dragged.id)).map(
        (task) => ({ id: task.id, status: column }),
      ),
    );

    // No-op if the card landed exactly where it started.
    const unchanged =
      dragged.status === status &&
      byStatus(status).findIndex((task) => task.id === dragged.id) === index;
    if (unchanged) return;

    onReorder(snapshot);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <section
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget(status);
            }}
            onDragLeave={() => setDropTarget((current) => (current === status ? null : current))}
            onDrop={() => handleDrop(status)}
            aria-dropeffect={draggingId ? 'move' : undefined}
            className={cn(
              'flex w-[280px] shrink-0 flex-col rounded-lg border border-border transition-colors',
              dropTarget === status && 'border-accent bg-accent/5',
            )}
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
              <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
              <button
                type="button"
                onClick={() => onAddTask(status)}
                aria-label={`Add task to ${STATUS_LABELS[status]}`}
                className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-3.5" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {columnTasks.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              )}

              {columnTasks.map((task, index) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTarget(null);
                    setDropIndex(null);
                  }}
                  // Hovering the top half inserts above this card, the bottom
                  // half below it — the usual reorder affordance.
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const box = event.currentTarget.getBoundingClientRect();
                    const after = event.clientY > box.top + box.height / 2;
                    setDropTarget(status);
                    setDropIndex(after ? index + 1 : index);
                  }}
                  className={cn(
                    'group cursor-grab rounded-md border border-border bg-card p-2.5 shadow-sm transition-all',
                    'hover:border-foreground/20 hover:shadow-md active:cursor-grabbing',
                    draggingId === task.id && 'opacity-50 ring-2 ring-accent',
                    dropTarget === status &&
                      dropIndex === index &&
                      draggingId !== task.id &&
                      'border-t-2 border-t-accent',
                  )}
                >
                  <div className="flex items-start gap-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="min-w-0 flex-1 text-sm transition-colors hover:text-accent hover:underline"
                    >
                      {task.title}
                    </Link>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      <TaskRowActions
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onStatusChange={(next) => onStatusChange(task, next)}
                        onPriorityChange={(next) => onPriorityChange(task, next)}
                        onDelete={() => onDeleteTask(task)}
                      />
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <PriorityBadge priority={task.priority} className="text-xs" />
                    <MemberCell user={task.assignee} className="size-5" />
                  </div>

                  {task.dueDate && (
                    <p
                      className={cn(
                        'mt-1.5 text-xs',
                        isOverdue(task.dueDate, task.status)
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatDate(task.dueDate)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
