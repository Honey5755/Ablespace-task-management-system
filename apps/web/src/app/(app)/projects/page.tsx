'use client';

import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell';
import { PriorityBadge, PriorityIcon } from '@/components/priority';
import { SearchInput } from '@/components/search-input';
import { MemberCell } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { useDebounced } from '@/hooks/use-debounced';
import { api } from '@/lib/api';
import { formatDate, fromDateInputValue } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type Project,
  type TaskPriority,
} from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebounced(search, 250);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setProjects(await api.listProjects(debouncedSearch || undefined));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load projects');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const setPriority = async (project: Project, priority: TaskPriority): Promise<void> => {
    await api.updateProject(project.id, { priority });
    await load();
  };

  const remove = async (project: Project): Promise<void> => {
    setProjects((current) => current.filter((item) => item.id !== project.id));
    try {
      await api.deleteProject(project.id);
    } finally {
      await load();
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        actions={
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
            <Button size="sm" className="h-8" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" />
              {/* The design labels this "+ Add Project" on one frame and
                  "+ Add Task" on two others; the former is correct here. */}
              <span className="hidden sm:inline">Add Project</span>
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

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden bg-muted/60 sm:flex">
            <div className="flex-1 px-4 py-2.5 text-sm font-medium">Projects</div>
            <div className="w-32 shrink-0 px-4 py-2.5 text-sm font-medium">Priority</div>
            <div className="w-24 shrink-0 px-4 py-2.5 text-sm font-medium">Lead</div>
            <div className="w-32 shrink-0 px-4 py-2.5 text-sm font-medium">Due Date</div>
            <div className="w-20 shrink-0 px-4 py-2.5 text-right text-sm font-medium">Actions</div>
          </div>

          {isLoading && projects.length === 0 ? (
            [0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-4 border-t border-border px-4 py-3">
                <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="size-6 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))
          ) : projects.length === 0 ? (
            <p className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {search ? 'No matching projects.' : 'No projects yet.'}
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="relative flex flex-col border-t border-border transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 px-4 py-2.5">
                  <span className="text-sm text-accent">{project.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {project._count.tasks} task{project._count.tasks === 1 ? '' : 's'}
                  </span>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
                    <PriorityBadge priority={project.priority} className="text-xs" />
                    {project.dueDate && <span>{formatDate(project.dueDate)}</span>}
                  </div>
                </div>

                <div className="hidden w-32 shrink-0 px-4 sm:block">
                  <PriorityBadge priority={project.priority} />
                </div>
                <div className="hidden w-24 shrink-0 px-4 sm:block">
                  <MemberCell user={project.lead} />
                </div>
                <div className="hidden w-32 shrink-0 px-4 text-sm text-muted-foreground sm:block">
                  {formatDate(project.dueDate) || '—'}
                </div>

                <div className="absolute right-2 top-2 sm:static sm:w-20 sm:shrink-0 sm:px-4 sm:text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Actions for ${project.name}`}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="w-40">
                            <DropdownMenuLabel>Priority</DropdownMenuLabel>
                            {PRIORITY_ORDER.map((priority) => (
                              <DropdownMenuCheckItem
                                key={priority}
                                checked={project.priority === priority}
                                onSelect={() => setPriority(project, priority)}
                              >
                                <PriorityIcon priority={priority} />
                                {PRIORITY_LABELS[priority]}
                              </DropdownMenuCheckItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => remove(project)}>
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex w-full items-center gap-1.5 border-t border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add Projects
          </button>
        </div>
      </main>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={load} />
    </>
  );
}

function ProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setPriority('none');
    setDueDate('');
    setError(null);
  }, [open]);

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await api.createProject({
        name: name.trim(),
        priority,
        dueDate: fromDateInputValue(dueDate),
      });
      await onCreated();
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
          <DialogTitle>Add project</DialogTitle>
          <DialogDescription>Group related tasks under a project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project
            </label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Design Homepage"
              autoFocus
              required
              maxLength={200}
            />
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

          <div className="grid gap-1.5">
            <label htmlFor="project-due" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

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
              {isSaving ? 'Saving…' : 'Add project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
