import {
  IsOptional,
  IsInt,
  IsDateString,
  IsString,
  IsIn,
  IsNumber,
} from 'class-validator';

export class UpdateMatchDto {
  @IsOptional()
  @IsInt()
  team_a_id?: number;

  @IsOptional()
  @IsInt()
  team_b_id?: number;

  @IsOptional()
  @IsDateString()
  match_date?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsIn(['scheduled', 'live', 'completed'])
  status?: 'scheduled' | 'live' | 'completed';

  @IsOptional()
  @IsInt()
  winner_team_id?: number | null;

  @IsOptional()
  @IsNumber()
  overs_per_side?: number;
}
