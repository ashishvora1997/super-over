import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsIn(['upcoming', 'ongoing'])
  status?: 'upcoming' | 'ongoing';
}
