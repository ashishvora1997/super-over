import {
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateMatchDto {
  @IsOptional()
  @IsInt()
  tournament_id?: number;

  @IsInt()
  team_a_id: number;

  @IsInt()
  team_b_id: number;

  @IsDateString()
  match_date: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  overs_per_side?: number;

  declare created_by: number;
}
