import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Match } from '../../match/models/match.model';
import { Team } from '../../teams/models/teams.model';
import { Player } from 'src/modules/players/models/players.model';

@Table({ tableName: 'innings' })
export class Innings extends Model {
  @ForeignKey(() => Match)
  @Column({ allowNull: false })
  declare match_id: number;

  @Column({ allowNull: false })
  declare innings_number: number;

  @ForeignKey(() => Team)
  @Column({ allowNull: false })
  declare batting_team_id: number;

  @ForeignKey(() => Team)
  @Column({ allowNull: false })
  declare bowling_team_id: number;

  @Column({ defaultValue: 0 })
  declare total_runs: number;

  @Column({ defaultValue: 0 })
  declare wickets: number;

  @Column({ defaultValue: 0 })
  declare overs: number;

  @Column({ defaultValue: 0 })
  declare balls: number;

  @Column({
    type: DataType.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started',
  })
  declare status: 'not_started' | 'in_progress' | 'completed';

  @ForeignKey(() => Player)
  @Column({ allowNull: true })
  declare striker_id: number;

  @ForeignKey(() => Player)
  @Column({ allowNull: true })
  declare non_striker_id: number;

  @ForeignKey(() => Player)
  @Column({ allowNull: true })
  declare bowler_id: number;

  @BelongsTo(() => Match)
  declare match: Match;

  @BelongsTo(() => Team, 'batting_team_id')
  declare battingTeam: Team;

  @BelongsTo(() => Team, 'bowling_team_id')
  declare bowlingTeam: Team;

  @BelongsTo(() => Player, 'striker_id')
  declare striker: Player;

  @BelongsTo(() => Player, 'non_striker_id')
  declare nonStriker: Player;

  @BelongsTo(() => Player, 'bowler_id')
  declare bowler: Player;
}
