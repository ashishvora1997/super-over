import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Tournament } from '../../tournament/models/tournament.model';
import { Team } from '../../teams/models/teams.model';

@Table({ tableName: 'points_table' })
export class PointsTable extends Model {
  @ForeignKey(() => Tournament)
  @Column({ allowNull: false })
  declare tournament_id: number;

  @ForeignKey(() => Team)
  @Column({ allowNull: false })
  declare team_id: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare matches_played: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare wins: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare losses: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare ties: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare no_results: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare points: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare runs_scored: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare balls_faced: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare runs_conceded: number;

  @Column({ allowNull: false, defaultValue: 0 })
  declare balls_bowled: number;

  @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: null })
  declare net_run_rate: number | null;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @BelongsTo(() => Team)
  declare team: Team;
}
