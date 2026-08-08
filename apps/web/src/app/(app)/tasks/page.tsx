'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell';
import { BoardView } from '@/components/board-view';
import { FieldsMenu, type ViewMode } from '@/components/fields-menu';
import { EMPTY_FILTERS, FilterMenu, type TaskFilters } from '@/components/filter-menu';
import { SearchInput } from '@/components/search-input';
import { TaskDialog } from '@/components/task-dialog';
import { DEFAULT_FIELDS, TaskGroup, type VisibleFields } from '@/components/task-group';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/use-tasks';
import { api } from '@/lib/api';
import { useDebounced } from '@/hooks/use-debounced';
import {
  TASK_STATUSES,
  VISIBLE_STATUSES,
  type CreateTaskInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields] = useState<VisibleFields>(DEFAULT_FIELDS);
  const [view, setView] = useState<ViewMode>('list');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>('todo');

  // Debounced so typing doesn't fire a request per keystroke.
  const debouncedSearch = useDebounced(search, 250);

  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status.length ? filters.status : undefined,
      priority: filters.priority.length ? filters.priority : undefined,
      labelId: filters.labelId.length ? filters.labelId : undefined,
    }),
    [debouncedSearch, filters],
  );

  const { tasks, labels, isLoading, error, refresh, applyUpdate, removeLocal } = useTasks(query);

  const isFiltering =
    Boolean(debouncedSearch) ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.labelId.length > 0;

  /**
   * The design draws To Do / Doing / Completed. Backlog is a real status in the
   * detail panel, so its group is rendered only when it would otherwise hide
   * tasks — keeping the default view identical to the frames.
   */
  const groups = useMemo(() => {
    const hasBacklog = tasks.some((task) => task.status === 'backlog');
    const statuses = hasBacklog ? TASK_STATUSES : VISIBLE_STATUSES;
    return statuses.filter((status) =>
      filters.status.length ? filters.status.includes(status) : true,
    );
  }, [tasks, filters.status]);

  const openCreate = (status: TaskStatus): void => {
    setEditingTask(null);
    setDialogStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (task: Task): void => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: CreateTaskInput): Promise<void> => {
    if (editingTask) {
      applyUpdate(await api.updateTask(editingTask.id, input));
    } else {
      await api.createTask(input);
    }
    await refresh();
  };

  const handleStatusChange = async (task: Task, status: TaskStatus): Promise<void> => {
    applyUpdate(await api.updateTask(task.id, { status }));
    await refresh();
  };

  const handlePriorityChange = async (task: Task, priority: TaskPriority): Promise<void> => {
    applyUpdate(await api.updateTask(task.id, { priority }));
  };

  /** Board drag-and-drop: persists the whole column order in one request. */
  const handleReorder = async (items: { id: string; status: TaskStatus }[]): Promise<void> => {
    await api.reorderTasks(items);
    await refresh();
  };

  const handleDelete = async (task: Task): Promise<void> => {
    // Optimistic: the row disappears immediately, then we reconcile.
    removeLocal(task.id);
    try {
      await api.deleteTask(task.id);
    } finally {
      await refresh();
    }
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
            <FieldsMenu
              fields={fields}
              onFieldsChange={setFields}
              view={view}
              onViewChange={setView}
            />
            <FilterMenu filters={filters} onFiltersChange={setFilters} labels={labels} />
            <Button size="sm" className="h-8" onClick={() => openCreate('todo')}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 px-4 pb-10 sm:px-6">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {isLoading && tasks.length === 0 ? (
          <SkeletonGroups />
        ) : tasks.length === 0 && isFiltering ? (
          // Only a narrowed-to-nothing result gets a dedicated empty state. With
          // no filters the groups still render — the design always shows all
          // three tables, and each carries its own "Add Task" row.
          <EmptyState
            title="No matching tasks"
            body="Try a different search term or clear your filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilters(EMPTY_FILTERS);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : view === 'board' ? (
          <BoardView
            columns={groups}
            tasks={tasks}
            onAddTask={openCreate}
            onEditTask={openEdit}
            onReorder={handleReorder}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onDeleteTask={handleDelete}
          />
        ) : (
          groups.map((status) => (
            <TaskGroup
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              fields={fields}
              onAddTask={openCreate}
              onEditTask={openEdit}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDeleteTask={handleDelete}
            />
          ))
        )}
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultStatus={dialogStatus}
        labels={labels}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function SkeletonGroups() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((group) => (
        <div key={group}>
          <div className="mb-1.5 h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="overflow-hidden rounded-lg border border-border">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="size-6 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
