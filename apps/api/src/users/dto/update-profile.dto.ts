import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Backs Settings › Profile. Every field is independently optional. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'Full name cannot be empty' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @Transform(trim)
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(80)
  title?: string;

  // "One word, like a nickname or first name" — enforce the single-word rule.
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(40)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username must be one word (letters, numbers, dot, underscore or hyphen)',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
