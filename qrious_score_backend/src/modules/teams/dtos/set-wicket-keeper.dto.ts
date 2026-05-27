import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class SetWicketKeeperDto {
  @IsInt()
  @IsNotEmpty()
  team_id!: number;

  @IsInt()
  @IsOptional()
  player_id!: number | null;
}
