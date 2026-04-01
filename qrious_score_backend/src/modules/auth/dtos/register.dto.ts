import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Name is required' })
  name!: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254, { message: 'Email is too long' })
  email!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}
