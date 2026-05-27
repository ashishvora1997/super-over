import { IsEmail, IsInt, IsNotEmpty } from 'class-validator';

export class AddMatchScorerDto {
  @IsInt()
  @IsNotEmpty()
  match_id!: number;

  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
