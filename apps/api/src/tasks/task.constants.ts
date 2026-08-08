/**
 * SQLite has no native enum type, so these are the single source of truth for
 * the allowed string values and are enforced at the DTO layer via @IsIn.
 *
 * Both sets are taken from the Figma dropdowns: the status list includes
 * `backlog` (seen in the detail panel) alongside the three groups drawn on the
 * task list, and priority has five values, not three.
 */
export const TASK_STATUSES = ['backlog', 'todo', 'doing', 'completed'] as const;
export const TASK_PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Descending urgency, so "sort by priority" isn't alphabetical. */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

/** Only these three groups are drawn on the list; backlog renders when non-empty. */
export const DEFAULT_VISIBLE_STATUSES: TaskStatus[] = ['todo', 'doing', 'completed'];
