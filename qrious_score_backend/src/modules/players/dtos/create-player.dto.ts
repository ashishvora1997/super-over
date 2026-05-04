import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreatePlayerDto {
  @IsString({ message: 'Name is required' })
  name!: string;

  @IsIn(['batsman', 'bowler', 'all_rounder', 'wicket_keeper'], {
    message: 'Invalid role',
  })
  role!: string;

  @IsOptional()
  @IsIn(['RHB', 'LHB'], {
    message: 'Batting style must be one of: RHB, LHB',
  })
  batting_style?: string;

  @IsOptional()
  @IsIn(['RAF', 'LAF', 'OFF', 'LAO', 'LEG'], {
    message: 'Bowling style must be one of: RAF, LAF, OFF, LAO, LEG',
  })
  bowling_style?: string;
}
