import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateBallEventDto {
  @IsNumber()
  @IsNotEmpty()
  innings_id: number;

  @IsNumber()
  @IsNotEmpty()
  striker_id: number;

  @IsNumber()
  @IsNotEmpty()
  non_striker_id: number;

  @IsNumber()
  @IsNotEmpty()
  bowler_id: number;

  @IsNumber()
  @Min(0)
  runs_bat: number;

  @IsOptional()
  @IsEnum(['wide', 'no_ball', 'bye', 'leg_bye'])
  extra_type?: 'wide' | 'no_ball' | 'bye' | 'leg_bye';

  @IsOptional()
  @IsNumber()
  @Min(0)
  runs_extra?: number;

  @IsOptional()
  @IsBoolean()
  is_wicket?: boolean;

  @ValidateIf((o) => o.is_wicket === true)
  @IsNotEmpty({ message: 'wicket_type is required when is_wicket is true' })
  @IsEnum([
    'bowled',
    'caught',
    'lbw',
    'run_out',
    'stumped',
    'hit_wicket',
    'retired_hurt',
  ])
  wicket_type?:
    | 'bowled'
    | 'caught'
    | 'lbw'
    | 'run_out'
    | 'stumped'
    | 'hit_wicket'
    | 'retired_hurt';

  @ValidateIf((o) => o.is_wicket === true)
  @IsNotEmpty({
    message: 'dismissed_player_id is required when is_wicket is true',
  })
  @IsNumber()
  dismissed_player_id?: number;

  @ValidateIf(
    (o) =>
      o.wicket_type === 'caught' ||
      o.wicket_type === 'stumped' ||
      o.wicket_type === 'run_out',
  )
  @IsNotEmpty({
    message:
      'fielder_id is required for caught, stumped, and run_out dismissals',
  })
  @IsNumber()
  fielder_id?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
