import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  /** Ordering slot within a status column; set when reordering via drag-and-drop. */
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
