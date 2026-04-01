import { IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
