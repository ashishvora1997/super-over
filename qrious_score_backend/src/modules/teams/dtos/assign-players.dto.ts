import { IsArray, IsNumber } from 'class-validator';

export class AssignPlayersDto {
  @IsNumber()
  team_id: number;

  @IsArray()
  player_ids: number[];
}
