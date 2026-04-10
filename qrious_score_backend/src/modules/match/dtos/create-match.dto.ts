import { IsInt, IsDateString, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  tournament_id: number;

  @IsInt()
  team_a_id: number;

  @IsInt()
  team_b_id: number;

  @IsDateString()
  match_date: string;

  @IsString()
  venue: string;
}
