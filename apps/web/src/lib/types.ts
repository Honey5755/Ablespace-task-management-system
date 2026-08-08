/** Mirrors the API's validated string unions (apps/api/src/tasks/task.constants.ts). */
export const TASK_STATUSES = ['backlog', 'todo', 'doing', 'completed'] as const;
export const TASK_PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Group headings exactly as drawn on the task list. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  doing: 'Doing',
  completed: 'Completed',
};

/** The three groups the design renders; backlog appears only when populated. */
export const VISIBLE_STATUSES: TaskStatus[] = ['todo', 'doing', 'completed'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: 'No Priority',
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Dropdown order from the Figma priority menu. */
export const PRIORITY_ORDER: TaskPriority[] = ['none', 'urgent', 'high', 'medium', 'low'];

export interface User {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  username: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
}

export type UserRef = Pick<User, 'id' | 'name' | 'avatarUrl'> & { email?: string | null };

export interface Label {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: UserRef;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actor: UserRef;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  position: number;
  ownerId: string;
  assigneeId: string | null;
  projectId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: UserRef | null;
  labels: Pick<Label, 'id' | 'name' | 'color'>[];
  project: { id: string; name: string } | null;
  _count: { subtasks: number; comments: number };
}

export interface TaskDetail extends Task {
  subtasks: Task[];
  comments: Comment[];
  activities: Activity[];
}

export interface Project {
  id: string;
  name: string;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  lead: UserRef | null;
  _count: { tasks: number };
}

export interface TaskStats {
  total: number;
  backlog: number;
  todo: number;
  doing: number;
  completed: number;
  overdue: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  startDate?: string | null;
  projectId?: string | null;
  parentId?: string | null;
  assigneeId?: string | null;
  labelIds?: string[];
}

export type UpdateTaskInput = Partial<CreateTaskInput> & { position?: number };

export interface TaskQuery {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  labelId?: string[];
  projectId?: string;
  search?: string;
  sort?: 'position' | 'createdAt' | 'dueDate' | 'priority' | 'title';
  order?: 'asc' | 'desc';
  includeSubtasks?: boolean;
}

export interface CreateProjectInput {
  name: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  leadId?: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
}
