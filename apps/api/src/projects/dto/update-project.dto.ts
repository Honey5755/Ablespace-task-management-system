import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
