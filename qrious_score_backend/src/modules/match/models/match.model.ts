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
import { User } from '../../users/models/user.model';
import { Toss } from 'src/modules/toss/models/toss.model';
import { Innings } from 'src/modules/innings/models/innings.model';
import { Rules } from 'src/modules/tournament/models/rules.model';
import { MatchScorer } from './match-scorer.model';

@Table({
  tableName: 'matches',
  timestamps: true,
})
export class Match extends Model {
  @ForeignKey(() => Tournament)
  @Column({
    allowNull: true,
  })
  declare tournament_id: number | null;

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

  @Column({
    allowNull: false,
    defaultValue: 20,
  })
  declare overs_per_side: number;

  @Column({
    allowNull: true,
  })
  declare overs_per_bowler: number | null;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
  })
  declare created_by: number | null;

  @ForeignKey(() => Team)
  @Column
  declare winner_team_id: number;

  @Column({
    type: DataType.ENUM('win', 'tie', 'no_result', 'super_over', 'draw'),
    allowNull: true,
  })
  declare result: 'win' | 'tie' | 'no_result' | 'super_over' | 'draw' | null;

  @Column({
    defaultValue: false,
  })
  declare is_super_over: boolean;

  @Column({
    defaultValue: 0,
  })
  declare super_over_number: number;

  @ForeignKey(() => Team)
  @Column({
    allowNull: true,
  })
  declare super_over_chasing_team_id: number | null;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
  })
  declare active_scorer_id: number | null;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @BelongsTo(() => Team, 'team_a_id')
  declare teamA: Team;

  @BelongsTo(() => Team, 'team_b_id')
  declare teamB: Team;

  @BelongsTo(() => Team, 'winner_team_id')
  declare winner: Team;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;

  @BelongsTo(() => User, 'active_scorer_id')
  declare activeScorer: User;

  @HasOne(() => Toss)
  declare toss: Toss;

  @HasMany(() => Innings)
  declare innings: Innings[];

  @HasOne(() => Rules)
  declare rules: Rules;

  @HasMany(() => MatchScorer)
  declare matchScorers: MatchScorer[];
}
