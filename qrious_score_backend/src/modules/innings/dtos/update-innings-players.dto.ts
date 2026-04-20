import { IsNumber, IsOptional } from 'class-validator';

export class UpdateInningsPlayersDto {
  @IsNumber()
  @IsOptional()
  striker_id?: number;

  @IsNumber()
  @IsOptional()
  non_striker_id?: number;

  @IsNumber()
  @IsOptional()
  bowler_id?: number;
}
