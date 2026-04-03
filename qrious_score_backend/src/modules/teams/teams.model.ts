import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsToMany,
} from 'sequelize-typescript';

import { User } from '../users/user.model';
import { Player } from '../players/players.model';
import { TeamPlayer } from './team-player.model';
import { Tournament } from '../tournament/tournament.model';
import { TournamentTeam } from '../tournament/tournament-team.model';

@Table({ tableName: 'teams' })
export class Team extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare logo: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare user_id: number;

  @BelongsToMany(() => Player, () => TeamPlayer)
  declare players: Player[];

  @BelongsToMany(() => Tournament, () => TournamentTeam)
  tournaments: Tournament[];
}
