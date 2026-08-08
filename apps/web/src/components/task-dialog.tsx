'use client';

import { useEffect, useState } from 'react';
import { PriorityIcon } from '@/components/priority';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { fromDateInputValue, toDateInputValue } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  TASK_STATUSES,
  type CreateTaskInput,
  type Label,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  task?: Task | null;
  /** Pre-selected group when created from a group's "Add Task" row. */
  defaultStatus?: TaskStatus;
  labels: Label[];
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = 'todo',
  labels,
  onSubmit,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [dueDate, setDueDate] = useState('');
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed the form whenever the dialog opens, so a previous edit doesn't leak.
  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setStatus(task?.status ?? defaultStatus);
    setPriority(task?.priority ?? 'none');
    setDueDate(toDateInputValue(task?.dueDate));
    setLabelIds(task?.labels.map((label) => label.id) ?? []);
    setError(null);
  }, [open, task, defaultStatus]);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: fromDateInputValue(dueDate),
        labelIds,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'Add task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details of this task.' : 'Create a task in your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="task-title" className="text-sm font-medium">
              Task
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Design Homepage"
              autoFocus
              required
              maxLength={200}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add more detail…"
              rows={3}
              maxLength={5000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Status</span>
              <div className="flex flex-wrap gap-1">
                {TASK_STATUSES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    aria-pressed={status === option}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-colors',
                      status === option
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {STATUS_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="task-due" className="text-sm font-medium">
                Due Date
              </label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Priority</span>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPriority(option)}
                  aria-pressed={priority === option}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors',
                    priority === option
                      ? 'border-foreground bg-muted text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <PriorityIcon priority={option} />
                  {PRIORITY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          {labels.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-sm font-medium">Labels</span>
              <div className="flex flex-wrap gap-1">
                {labels.map((label) => {
                  const selected = labelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() =>
                        setLabelIds((current) =>
                          selected
                            ? current.filter((id) => id !== label.id)
                            : [...current, label.id],
                        )
                      }
                      aria-pressed={selected}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs transition-colors',
                        selected
                          ? 'border-foreground bg-muted text-foreground'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : task ? 'Save changes' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
