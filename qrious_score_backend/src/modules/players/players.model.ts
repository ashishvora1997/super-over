import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from '../users/user.model';
import { Team } from '../teams/teams.model';
import { TeamPlayer } from '../teams/team-player.model';

@Table({
  tableName: 'players',
  timestamps: true,
})
export class Player extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM('batsman', 'bowler', 'all_rounder', 'wicket_keeper'),
    allowNull: false,
  })
  declare role: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare batting_style: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare bowling_style: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare user_id: number;

  @BelongsToMany(() => Team, () => TeamPlayer)
  teams!: Team[];
}
