import { IsInt, IsOptional } from 'class-validator';

export class SetCaptainDto {
  @IsInt()
  declare team_id: number;

  @IsInt()
  @IsOptional()
  declare player_id: number | null;
}
