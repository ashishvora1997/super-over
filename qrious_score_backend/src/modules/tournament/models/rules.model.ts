import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Tournament } from '../../tournament/models/tournament.model';
import { Match } from '../../match/models/match.model';

@Table({ tableName: 'rules' })
export class Rules extends Model {
  @ForeignKey(() => Tournament)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare tournament_id: number | null;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @ForeignKey(() => Match)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare match_id: number | null;

  @BelongsTo(() => Match)
  declare match: Match;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare wide_runs: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare no_ball_runs: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare count_wide_as_legal_delivery: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare count_no_ball_as_legal_delivery: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare ignore_wide_rule: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare ignore_no_ball_rule: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_customized: boolean;
}
