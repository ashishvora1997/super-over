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

export enum WicketType {
  BOWLED = 'bowled',
  CAUGHT = 'caught',
  LBW = 'lbw',
  RUN_OUT = 'run_out',
  STUMPED = 'stumped',
  HIT_WICKET = 'hit_wicket',
  RETIRED_HURT = 'retired_hurt',
}

export enum ExtraType {
  WIDE = 'wide',
  NO_BALL = 'no_ball',
  BYE = 'bye',
  LEG_BYE = 'leg_bye',
}

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
  @IsEnum(ExtraType)
  extra_type?: ExtraType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  runs_extra?: number;

  @IsOptional()
  @IsBoolean()
  is_wicket?: boolean;

  @ValidateIf((o) => o.is_wicket === true)
  @IsNotEmpty({ message: 'wicket_type is required when is_wicket is true' })
  @IsEnum(WicketType)
  wicket_type?: WicketType;

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

  @IsOptional()
  @IsNumber()
  runs_completed?: number;

  @IsOptional()
  @IsBoolean()
  batsmen_crossed?: boolean;
}
