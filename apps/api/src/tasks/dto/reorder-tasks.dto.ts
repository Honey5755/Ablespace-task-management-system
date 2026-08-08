import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { TASK_STATUSES, TaskStatus } from '../task.constants';

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsIn(TASK_STATUSES)
  status!: TaskStatus;
}

/**
 * Full ordered snapshot of the affected group(s). Sending the whole list keeps
 * the write idempotent — the client can retry without corrupting the order.
 */
export class ReorderTasksDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
