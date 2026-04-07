import { IsInt } from 'class-validator';

export class SetCaptainDto {
  @IsInt()
  declare team_id: number;

  @IsInt()
  declare player_id: number;
}
