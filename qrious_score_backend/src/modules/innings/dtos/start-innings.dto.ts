import { IsNotEmpty, IsNumber } from 'class-validator';

export class StartInningsDto {
  @IsNumber()
  @IsNotEmpty()
  striker_id: number;

  @IsNumber()
  @IsNotEmpty()
  non_striker_id: number;

  @IsNumber()
  @IsNotEmpty()
  bowler_id: number;
}
