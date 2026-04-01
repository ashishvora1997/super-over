import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254, { message: 'Email is too long' })
  email: string;
}
