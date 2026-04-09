import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';

import { Team } from '../../teams/models/teams.model';
import { TournamentTeam } from './tournament-team.model';

@Table({ tableName: 'tournaments' })
export class Tournament extends Model {
  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: true })
  declare location: string;

  @Column(DataType.DATE)
  declare start_date: Date;

  @Column(DataType.DATE)
  declare end_date: Date;

  @Column({
    type: DataType.ENUM('upcoming', 'ongoing', 'completed'),
    defaultValue: 'upcoming',
  })
  declare status: 'upcoming' | 'ongoing' | 'completed';

  @BelongsToMany(() => Team, () => TournamentTeam)
  declare teams: Team[];
}
