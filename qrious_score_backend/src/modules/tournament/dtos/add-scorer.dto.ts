import { IsEmail, IsInt } from 'class-validator';

export class AddScorerDto {
  @IsInt()
  tournament_id: number;

  @IsEmail()
  email: string;
}
