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

@Table({ tableName: 'tosses' })
export class Toss extends Model {
  @ForeignKey(() => Match)
  @Column({ allowNull: false })
  declare match_id: number;

  @ForeignKey(() => Team)
  @Column({ allowNull: false })
  declare toss_winner_team_id: number;

  @Column({
    type: DataType.ENUM('bat', 'bowl'),
    allowNull: false,
  })
  declare elected_to: 'bat' | 'bowl';

  @BelongsTo(() => Match)
  declare match: Match;

  @BelongsTo(() => Team, 'toss_winner_team_id')
  declare tossWinnerTeam: Team;
}
