import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token is required' })
  token!: string;

  @IsString({ message: 'Password is required' })
  password!: string;
}
