import { IsNumber, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsNumber()
  userId: number;

  @IsString()
  @Length(6, 6)
  otp: string;
}
