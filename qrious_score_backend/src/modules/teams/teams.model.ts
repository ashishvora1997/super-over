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

@Table({ tableName: 'teams' })
export class Team extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  logo: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id: number;

  @BelongsToMany(() => Player, () => TeamPlayer)
  players: Player[];
}
