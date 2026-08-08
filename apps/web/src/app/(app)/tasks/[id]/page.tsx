'use client';

import {
  Calendar,
  Eye,
  Link2,
  Lock,
  MoreHorizontal,
  PanelRight,
  Plus,
  Send,
  Share2,
  Tag,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell';
import { PriorityBadge, PriorityIcon } from '@/components/priority';
import { TaskDialog } from '@/components/task-dialog';
import { Avatar, AvatarFallback, AvatarImage, MemberCell } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatDate, formatRelative, formatShortDate, initials, isOverdue } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  TASK_STATUSES,
  type Label,
  type TaskDetail,
  type TaskStatus,
} from '@/lib/types';

const STATUS_DOT: Record<TaskStatus, string> = {
  backlog: 'bg-priority-medium',
  todo: 'bg-muted-foreground',
  doing: 'bg-accent',
  completed: 'bg-priority-low',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setTask(await api.getTask(id));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load task');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    api.listLabels().then(setLabels).catch(() => setLabels([]));
  }, [load]);

  const patch = async (input: Parameters<typeof api.updateTask>[1]): Promise<void> => {
    await api.updateTask(id, input);
    await load();
  };

  const addComment = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!comment.trim()) return;
    await api.addComment(id, comment.trim());
    setComment('');
    await load();
  };

  const addSubtask = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!subtaskTitle.trim()) return;
    await api.createTask({ title: subtaskTitle.trim(), parentId: id });
    setSubtaskTitle('');
    setShowSubtaskInput(false);
    await load();
  };

  const deleteTask = async (): Promise<void> => {
    await api.deleteTask(id);
    router.push('/tasks');
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium">{error ?? 'Task not found'}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/tasks')}>
          Back to tasks
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title=""
        breadcrumbs={[
          task.project
            ? { label: 'Projects', href: '/projects' }
            : { label: 'Tasks', href: '/tasks' },
          { label: task.project?.name ?? task.title },
        ]}
      />

      <main className="flex flex-1 flex-col gap-6 px-4 pb-10 sm:px-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">{task.title}</h1>

            <div className="flex shrink-0 items-center gap-0.5">
              {/* Drawn in the design but not backed by data in a single-member
                  guest workspace — rendered as static affordances. See README. */}
              <IconButton label="Task visibility" disabled>
                <Lock className="size-4" />
              </IconButton>
              <span className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground">
                <Eye className="size-4" />1
              </span>
              <IconButton label="Share task" disabled>
                <Share2 className="size-4" />
              </IconButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label="More actions">
                    <MoreHorizontal className="size-4" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>Edit task</DropdownMenuItem>
                  <DropdownMenuItem destructive onSelect={deleteTask}>
                    <Trash2 />
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <IconButton
                label="Toggle details panel"
                onClick={() => setIsRailOpen((open) => !open)}
                className="hidden lg:inline-flex"
              >
                <PanelRight className="size-4" />
              </IconButton>
            </div>
          </div>

          {task.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <PropertyRow label="Properties">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs">
                <Avatar className="size-4">
                  {task.assignee?.avatarUrl && (
                    <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                  )}
                  <AvatarFallback>{initials(task.assignee?.name ?? '?')}</AvatarFallback>
                </Avatar>
                {task.assignee?.name ?? 'Unassigned'}
              </span>
              {task.dueDate && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
                    isOverdue(task.dueDate, task.status)
                      ? 'border-destructive/40 text-destructive'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  <Calendar className="size-3" />
                  {formatShortDate(task.dueDate)}
                </span>
              )}
            </PropertyRow>

            <PropertyRow label="Labels">
              {task.labels.length === 0 ? (
                <span className="text-xs text-muted-foreground">None</span>
              ) : (
                task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    <Tag className="size-3" />
                    {label.name}
                  </span>
                ))
              )}
            </PropertyRow>

            <PropertyRow label="Resources">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 className="size-3" />
                Add document or link…
              </span>
            </PropertyRow>
          </dl>

          {/* Subtasks */}
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-medium">Subtasks</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="hidden bg-muted/60 sm:flex">
                <div className="flex-1 px-4 py-2.5 text-sm font-medium">Task</div>
                <div className="w-32 shrink-0 px-4 py-2.5 text-sm font-medium">Priority</div>
                <div className="w-24 shrink-0 px-4 py-2.5 text-sm font-medium">Members</div>
                <div className="w-32 shrink-0 px-4 py-2.5 text-sm font-medium">Due Date</div>
                <div className="w-20 shrink-0 px-4 py-2.5 text-right text-sm font-medium">
                  Actions
                </div>
              </div>

              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex flex-col border-t border-border transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                >
                  <Link
                    href={`/tasks/${subtask.id}`}
                    className="min-w-0 flex-1 px-4 py-2.5 text-sm hover:text-accent hover:underline"
                  >
                    {subtask.title}
                  </Link>
                  <div className="hidden w-32 shrink-0 px-4 sm:block">
                    <PriorityBadge priority={subtask.priority} />
                  </div>
                  <div className="hidden w-24 shrink-0 px-4 sm:block">
                    <MemberCell user={subtask.assignee} />
                  </div>
                  <div className="hidden w-32 shrink-0 px-4 text-sm text-muted-foreground sm:block">
                    {formatDate(subtask.dueDate) || '—'}
                  </div>
                  <div className="px-4 pb-2.5 sm:w-20 sm:shrink-0 sm:pb-0 sm:text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteTask(subtask.id);
                        await load();
                      }}
                      aria-label={`Delete ${subtask.title}`}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {showSubtaskInput ? (
                <form onSubmit={addSubtask} className="flex gap-2 border-t border-border p-2">
                  <Input
                    value={subtaskTitle}
                    onChange={(event) => setSubtaskTitle(event.target.value)}
                    onKeyDown={(event) => event.key === 'Escape' && setShowSubtaskInput(false)}
                    placeholder="Subtask title"
                    autoFocus
                    className="h-8"
                  />
                  <Button type="submit" size="sm" className="h-8">
                    Add
                  </Button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubtaskInput(true)}
                  className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                  Add Subtasks
                </button>
              )}
            </div>
          </section>

          {/* Comments — the Figma heading reads "Subtasks" here, which is a
              duplicate-label bug in the source file. See README. */}
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-medium">Comments</h2>

            <div className="space-y-3">
              {task.comments.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      {entry.author.avatarUrl && (
                        <AvatarImage src={entry.author.avatarUrl} alt={entry.author.name} />
                      )}
                      <AvatarFallback>{initials(entry.author.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(entry.createdAt)}
                    </span>
                    {entry.author.id === user?.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteComment(id, entry.id);
                          await load();
                        }}
                        aria-label="Delete comment"
                        className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">{entry.body}</p>
                </div>
              ))}

              <form onSubmit={addComment} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <Avatar className="size-5">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback>{initials(user?.name ?? '?')}</AvatarFallback>
                </Avatar>
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a comment…"
                  maxLength={2000}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  aria-label="Post comment"
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Details rail */}
        {isRailOpen && (
          <aside className="w-full shrink-0 space-y-4 lg:w-[280px]">
            <div className="rounded-lg border border-border p-3">
              <h2 className="mb-3 text-sm font-medium">Details</h2>
              <dl className="space-y-2.5 text-sm">
                <DetailRow label="Status">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted">
                      <span className={cn('size-2 rounded-full', STATUS_DOT[task.status])} />
                      {STATUS_LABELS[task.status]}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      {TASK_STATUSES.map((status) => (
                        <DropdownMenuCheckItem
                          key={status}
                          checked={task.status === status}
                          onSelect={() => patch({ status })}
                        >
                          <span className={cn('size-2 rounded-full', STATUS_DOT[status])} />
                          {STATUS_LABELS[status]}
                        </DropdownMenuCheckItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Priority">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded px-1 py-0.5 hover:bg-muted">
                      <PriorityBadge priority={task.priority} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      {PRIORITY_ORDER.map((priority) => (
                        <DropdownMenuCheckItem
                          key={priority}
                          checked={task.priority === priority}
                          onSelect={() => patch({ priority })}
                        >
                          <PriorityIcon priority={priority} />
                          {PRIORITY_LABELS[priority]}
                        </DropdownMenuCheckItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Members">
                  <MemberCell user={task.assignee} className="size-5" />
                </DetailRow>

                <DetailRow label="Dates">
                  <span className="text-xs text-muted-foreground">
                    {task.dueDate ? formatShortDate(task.dueDate) : 'No date'}
                  </span>
                </DetailRow>

                <DetailRow label="Labels">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted">
                      {task.labels.length > 0 ? `${task.labels.length} selected` : 'Add labels'}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Labels</DropdownMenuLabel>
                      {labels.map((label) => {
                        const selected = task.labels.some((item) => item.id === label.id);
                        return (
                          <DropdownMenuCheckItem
                            key={label.id}
                            checked={selected}
                            onSelect={(event) => {
                              event.preventDefault();
                              const next = selected
                                ? task.labels.filter((item) => item.id !== label.id)
                                : [...task.labels, label];
                              void patch({ labelIds: next.map((item) => item.id) });
                            }}
                          >
                            {label.name}
                          </DropdownMenuCheckItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                {/* Drawn in the design; a guest workspace has one member, so
                    there is no distinct team or reporter to bind. See README. */}
                <DetailRow label="Teams">
                  <span className="text-xs text-muted-foreground">—</span>
                </DetailRow>
                <DetailRow label="Reporter">
                  <span className="text-xs text-muted-foreground">{user?.name ?? '—'}</span>
                </DetailRow>
              </dl>
            </div>

            <div className="rounded-lg border border-border p-3">
              <h2 className="mb-3 text-sm font-medium">Updates</h2>
              {task.activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {task.activities.map((activity) => (
                    <li key={activity.id} className="flex gap-2">
                      <Avatar className="mt-0.5 size-5 shrink-0">
                        {activity.actor.avatarUrl && (
                          <AvatarImage src={activity.actor.avatarUrl} alt={activity.actor.name} />
                        )}
                        <AvatarFallback>{initials(activity.actor.name)}</AvatarFallback>
                      </Avatar>
                      <p className="min-w-0 text-xs">
                        <span className="font-medium">
                          {activity.actor.id === user?.id ? 'You' : activity.actor.name}
                        </span>{' '}
                        <span className="text-muted-foreground">{activity.message}</span>
                        <span className="block text-muted-foreground/70">
                          {formatRelative(activity.createdAt)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </main>

      <TaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        labels={labels}
        onSubmit={async (input) => {
          await api.updateTask(id, input);
          await load();
        }}
      />
    </>
  );
}

/** forwardRef so Radix's `asChild` trigger can attach to it. */
const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ children, label, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors',
      'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      'disabled:pointer-events-none disabled:opacity-40',
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = 'IconButton';

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-center gap-1.5">{children}</dd>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
