import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';

import { Tournament } from './tournament.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'tournament_scorers' })
export class TournamentScorer extends Model {
  @ForeignKey(() => Tournament)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tournament_id: number;

  @BelongsTo(() => Tournament)
  declare tournament: Tournament;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare user_id: number;

  @BelongsTo(() => User)
  declare user: User;
}
