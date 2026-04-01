import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePlayerDto {
  @IsString({ message: 'Name is required' })
  name: string;

  @IsIn(['batsman', 'bowler', 'all_rounder', 'wicket_keeper'], {
    message: 'Invalid role',
  })
  role: string;

  @IsOptional()
  @IsString()
  batting_style?: string;

  @IsOptional()
  @IsString()
  bowling_style?: string;
}
