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

@Table({ tableName: 'matches' })
export class Match extends Model {
  @ForeignKey(() => Tournament)
  @Column
  declare tournament_id: number;

  @ForeignKey(() => Team)
  @Column
  declare team_a_id: number;

  @ForeignKey(() => Team)
  @Column
  declare team_b_id: number;

  @Column(DataType.DATE)
  declare match_date: Date;

  @Column
  declare venue: string;

  @Column({
    type: DataType.ENUM('scheduled', 'live', 'completed'),
    defaultValue: 'scheduled',
  })
  declare status: 'scheduled' | 'live' | 'completed';

  @ForeignKey(() => Team)
  @Column
  declare winner_team_id: number;

  // Relations
  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @BelongsTo(() => Team, 'team_a_id')
  declare teamA: Team;

  @BelongsTo(() => Team, 'team_b_id')
  declare teamB: Team;

  @BelongsTo(() => Team, 'winner_team_id')
  declare winner: Team;
}
