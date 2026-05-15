import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';

export class UpsertProfileDto {
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @IsOptional()
  @IsEnum([
    'top_order_batter',
    'middle_order_batter',
    'opening_batter',
    'wicket_keeper_batter',
    'wicket_keeper',
    'bowler',
    'all_rounder',
    'lower_order_batter',
    'none',
  ])
  playing_role?: string;

  @IsOptional()
  @IsEnum(['right_hand', 'left_hand', 'none'])
  batting_style?: string;

  @IsOptional()
  @IsEnum([
    'right_arm_fast',
    'right_arm_medium',
    'left_arm_fast',
    'left_arm_medium',
    'slow_left_arm_orthodox',
    'slow_left_arm_chinaman',
    'right_arm_off_break',
    'right_arm_leg_break',
    'none',
  ])
  bowling_style?: string;
}
