import {
  IsOptional,
  IsString,
  IsInt,
  MinLength,
  IsEmail,
  IsBoolean,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  captain_name?: string;

  @IsOptional()
  @IsEmail({ message: 'Invalid captain email format' })
  captain_email?: string;

  @IsOptional()
  @IsInt()
  tournament_id?: number;

  @IsOptional()
  @IsInt()
  created_by?: number;

  @IsOptional()
  @IsBoolean()
  add_creator_as_player?: boolean;
}
