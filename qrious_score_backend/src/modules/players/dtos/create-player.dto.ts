import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  IsEnum,
  IsInt,
} from 'class-validator';

export class CreatePlayerDto {
  @IsString({ message: 'Name is required' })
  name!: string;

  @IsIn(
    [
      'top_order_batter',
      'middle_order_batter',
      'opening_batter',
      'wicket_keeper_batter',
      'wicket_keeper',
      'bowler',
      'all_rounder',
      'lower_order_batter',
      'none',
    ],
    {
      message: 'Invalid playing role',
    },
  )
  playing_role!: string;

  @IsOptional()
  @IsIn(['right_hand', 'left_hand', 'none'], {
    message: 'Batting style must be one of: right_hand, left_hand, none',
  })
  batting_style?: string;

  @IsOptional()
  @IsIn(
    [
      'right_arm_fast',
      'right_arm_medium',
      'left_arm_fast',
      'left_arm_medium',
      'slow_left_arm_orthodox',
      'slow_left_arm_chinaman',
      'right_arm_off_break',
      'right_arm_leg_break',
      'none',
    ],
    {
      message: 'Invalid bowling style',
    },
  )
  bowling_style?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be in YYYY-MM-DD format' })
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsIn(['male', 'female'], {
    message: 'Gender must be either male or female',
  })
  gender?: string;

  @IsOptional()
  @IsString()
  profile_picture?: string;

  @IsOptional()
  @IsInt({ message: 'User ID must be a valid number' })
  user_id?: number;
}
