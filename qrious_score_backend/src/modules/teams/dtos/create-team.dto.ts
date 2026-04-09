import { IsOptional, IsString, IsInt, MinLength } from 'class-validator';

export class CreateTeamDto {
  @IsString({ message: 'Team name is required' })
  @MinLength(2)
  name!: string;

  @IsString({ message: 'Short name is required' })
  @MinLength(2)
  short_name!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  jersey_color?: string;

  @IsOptional()
  @IsString()
  home_ground?: string;

  @IsOptional()
  @IsInt()
  founded_year?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
