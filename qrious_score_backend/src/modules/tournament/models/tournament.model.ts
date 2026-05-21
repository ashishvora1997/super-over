import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  HasOne,
  HasMany,
} from 'sequelize-typescript';

import { Team } from '../../teams/models/teams.model';
import { TournamentTeam } from './tournament-team.model';
import { User } from '../../users/models/user.model';
import { Rules } from './rules.model';
import { TournamentScorer } from './tournament-scorer.model';

@Table({ tableName: 'tournaments' })
export class Tournament extends Model {
  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: true })
  declare city: string;

  @Column({ allowNull: false })
  declare organiser_name: string;

  @Column({ allowNull: false })
  declare organiser_email: string;

  @Column({ allowNull: false, type: DataType.DATEONLY })
  declare start_date: Date;

  @Column({ allowNull: false, type: DataType.DATEONLY })
  declare end_date: Date;

  @Column({
    type: DataType.ENUM('upcoming', 'ongoing', 'completed'),
    defaultValue: 'upcoming',
  })
  declare status: 'upcoming' | 'ongoing' | 'completed';

  @ForeignKey(() => User)
  @Column({ allowNull: false, type: DataType.INTEGER })
  declare created_by: number;

  @BelongsTo(() => User)
  declare creator: User;

  @BelongsToMany(() => Team, () => TournamentTeam)
  declare teams: Team[];

  @HasOne(() => Rules, 'tournament_id')
  declare rules: Rules;

  @HasMany(() => TournamentScorer, 'tournament_id')
  declare scorers: TournamentScorer[];
}
