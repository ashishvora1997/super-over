import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  declare name: string;

  @IsOptional()
  @IsString()
  declare location?: string;

  @IsOptional()
  @IsDateString()
  declare start_date?: string;

  @IsOptional()
  @IsDateString()
  declare end_date?: string;

  @IsOptional()
  @IsIn(['upcoming', 'ongoing'])
  declare status?: 'upcoming' | 'ongoing';
}
