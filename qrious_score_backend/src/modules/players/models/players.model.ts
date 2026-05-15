import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsToMany,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Team } from '../../teams/models/teams.model';
import { TeamPlayer } from '../../teams/models/team-player.model';

@Table({
  tableName: 'players',
  timestamps: true,
})
export class Player extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM(
      'top_order_batter',
      'middle_order_batter',
      'opening_batter',
      'wicket_keeper_batter',
      'wicket_keeper',
      'bowler',
      'all_rounder',
      'lower_order_batter',
      'none',
    ),
    allowNull: true,
  })
  declare playing_role: string;

  @Column({
    type: DataType.ENUM('right_hand', 'left_hand', 'none'),
    allowNull: true,
  })
  declare batting_style: string;

  @Column({
    type: DataType.ENUM(
      'right_arm_fast',
      'right_arm_medium',
      'left_arm_fast',
      'left_arm_medium',
      'slow_left_arm_orthodox',
      'slow_left_arm_chinaman',
      'right_arm_off_break',
      'right_arm_leg_break',
      'none',
    ),
    allowNull: true,
  })
  declare bowling_style: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare date_of_birth: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare location: string;

  @Column({
    type: DataType.ENUM('male', 'female'),
    allowNull: true,
  })
  declare gender: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare profile_picture: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsToMany(() => Team, () => TeamPlayer)
  declare teams: Team[];
}
