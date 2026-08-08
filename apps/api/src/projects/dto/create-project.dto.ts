import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TASK_PRIORITIES, TaskPriority } from '../../tasks/task.constants';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  leadId?: string | null;
}
