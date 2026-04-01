import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254, { message: 'Email is too long' })
  email: string;

  @IsString({ message: 'Password is required' })
  password: string;
}
