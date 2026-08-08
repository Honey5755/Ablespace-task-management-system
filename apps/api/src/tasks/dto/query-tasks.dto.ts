import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../task.constants';

export const TASK_SORTS = ['position', 'createdAt', 'dueDate', 'priority', 'title'] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

/** `?status=todo&status=doing` and `?status=todo,doing` both arrive as arrays. */
const toArray = ({ value }: { value: unknown }): unknown => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').filter(Boolean);
  return value;
};

export class QueryTasksDto {
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(TASK_STATUSES, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(TASK_PRIORITIES, { each: true })
  priority?: TaskPriority[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  labelId?: string[];

  @IsOptional()
  @IsString()
  projectId?: string;

  /** Case-insensitive substring match across title and description. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(TASK_SORTS)
  sort?: TaskSort;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  /**
   * Subtasks are fetched through their parent, so the list view excludes them
   * by default. Pass `includeSubtasks=true` to get a flat list.
   */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  includeSubtasks?: boolean;
}
