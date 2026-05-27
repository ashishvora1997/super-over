import { IsEmail, IsInt } from 'class-validator';

export class AddPlayerByEmailDto {
  @IsInt()
  team_id: number;

  @IsEmail()
  email: string;
}
