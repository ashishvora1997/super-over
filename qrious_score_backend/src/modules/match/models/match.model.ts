import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasOne,
  HasMany,
} from 'sequelize-typescript';

import { Tournament } from '../../tournament/models/tournament.model';
import { Team } from '../../teams/models/teams.model';
import { Toss } from 'src/modules/toss/models/toss.model';
import { Innings } from 'src/modules/innings/models/innings.model';

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

  @Column({ allowNull: false, defaultValue: 20 })
  declare overs_per_side: number;

  @ForeignKey(() => Team)
  @Column
  declare winner_team_id: number;

  @Column({
    type: DataType.ENUM('win', 'tie', 'no_result', 'super_over', 'draw'),
    allowNull: true,
  })
  declare result: 'win' | 'tie' | 'no_result' | 'super_over' | 'draw' | null;

  @Column({ defaultValue: false })
  declare is_super_over: boolean;

  @Column({ defaultValue: 0 })
  declare super_over_number: number;

  @ForeignKey(() => Team)
  @Column({ allowNull: true })
  declare super_over_chasing_team_id: number;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @BelongsTo(() => Team, 'team_a_id')
  declare teamA: Team;

  @BelongsTo(() => Team, 'team_b_id')
  declare teamB: Team;

  @BelongsTo(() => Team, 'winner_team_id')
  declare winner: Team;

  @HasOne(() => Toss)
  declare toss: Toss;

  @HasMany(() => Innings)
  declare innings: Innings[];
}
