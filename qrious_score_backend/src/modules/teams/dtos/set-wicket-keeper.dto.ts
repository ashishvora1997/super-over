import { IsInt, IsNotEmpty } from 'class-validator';

export class SetWicketKeeperDto {
  @IsInt()
  @IsNotEmpty()
  team_id!: number;

  @IsInt()
  @IsNotEmpty()
  player_id!: number;
}
