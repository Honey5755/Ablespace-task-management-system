import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GuestLoginDto {
  /** Optional display name; falls back to a generated one like "Swift Guest". */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;
}
