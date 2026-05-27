import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Match } from './match.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'match_scorers' })
export class MatchScorer extends Model {
  @ForeignKey(() => Match)
  @Column({ allowNull: false })
  declare match_id: number;

  @ForeignKey(() => User)
  @Column({ allowNull: false })
  declare user_id: number;

  @BelongsTo(() => Match)
  declare match: Match;

  @BelongsTo(() => User)
  declare user: User;
}
