import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const LABEL_COLORS = [
  'neutral',
  'blue',
  'violet',
  'emerald',
  'amber',
  'rose',
  'pink',
] as const;

export class CreateLabelDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'Label name cannot be empty' })
  @MaxLength(40)
  name!: string;

  @IsOptional()
  @IsIn(LABEL_COLORS)
  color?: (typeof LABEL_COLORS)[number];
}
