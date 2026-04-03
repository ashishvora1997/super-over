import { IsInt, IsArray, IsPositive, ArrayUnique } from 'class-validator';

export class AssignTeamsDto {
  @IsInt()
  @IsPositive()
  tournament_id: number;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  team_ids: number[];
}
