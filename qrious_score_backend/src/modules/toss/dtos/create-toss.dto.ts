import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateTossDto {
  @IsNumber()
  @IsNotEmpty()
  toss_winner_team_id: number;

  @IsEnum(['bat', 'bowl'])
  @IsNotEmpty()
  elected_to: 'bat' | 'bowl';
}
