import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Innings } from '../../innings/models/innings.model';
import { Player } from '../../players/models/players.model';

@Table({ tableName: 'ball_events' })
export class BallEvent extends Model {
  @ForeignKey(() => Innings)
  @Column({ allowNull: false })
  declare innings_id: number;

  @Column({ allowNull: false })
  declare over_number: number;

  @Column({ allowNull: false })
  declare ball_number: number;

  @ForeignKey(() => Player)
  @Column({ allowNull: false })
  declare striker_id: number;

  @ForeignKey(() => Player)
  @Column({ allowNull: false })
  declare non_striker_id: number;

  @ForeignKey(() => Player)
  @Column({ allowNull: false })
  declare bowler_id: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare runs_bat: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare runs_extra: number;

  @Column({
    type: DataType.ENUM('wide', 'no_ball', 'bye', 'leg_bye'),
    allowNull: true,
  })
  declare extra_type: 'wide' | 'no_ball' | 'bye' | 'leg_bye' | null;

  @Column({ allowNull: false, defaultValue: false })
  declare is_wicket: boolean;

  @Column({
    type: DataType.ENUM(
      'bowled',
      'caught',
      'lbw',
      'run_out',
      'stumped',
      'hit_wicket',
      'retired_hurt',
    ),
    allowNull: true,
  })
  declare wicket_type:
    | 'bowled'
    | 'caught'
    | 'lbw'
    | 'run_out'
    | 'stumped'
    | 'hit_wicket'
    | 'retired_hurt'
    | null;

  @ForeignKey(() => Player)
  @Column({ allowNull: true })
  declare dismissed_player_id: number | null;

  @ForeignKey(() => Player)
  @Column({ allowNull: true })
  declare fielder_id: number | null;

  @Column({ allowNull: false, defaultValue: true })
  declare is_legal: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, unknown> | null;

  @BelongsTo(() => Innings)
  declare innings: Innings;

  @BelongsTo(() => Player, 'striker_id')
  declare striker: Player;

  @BelongsTo(() => Player, 'non_striker_id')
  declare nonStriker: Player;

  @BelongsTo(() => Player, 'bowler_id')
  declare bowler: Player;

  @BelongsTo(() => Player, 'dismissed_player_id')
  declare dismissedPlayer: Player | null;

  @BelongsTo(() => Player, 'fielder_id')
  declare fielder: Player | null;
}
