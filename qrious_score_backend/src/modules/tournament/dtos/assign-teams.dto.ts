import { IsInt, IsArray, IsPositive, ArrayUnique } from 'class-validator';

export class AssignTeamsDto {
  @IsInt()
  @IsPositive()
  declare tournament_id: number;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  declare team_ids: number[];
}
