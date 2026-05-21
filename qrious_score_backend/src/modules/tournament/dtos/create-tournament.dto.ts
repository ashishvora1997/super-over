import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsInt,
} from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  declare name: string;

  @IsOptional()
  @IsString()
  declare city?: string;

  @IsString()
  declare organiser_name: string;

  @IsString()
  declare organiser_email: string;

  @IsDateString()
  declare start_date: string;

  @IsDateString()
  declare end_date: string;

  declare created_by: number;
}
