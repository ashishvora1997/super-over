import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsToMany,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from 'src/modules/users/models/user.model';
import { Player } from 'src/modules/players/models/players.model';
import { TeamPlayer } from './team-player.model';

@Table({ tableName: 'teams' })
export class Team extends Model {
  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false })
  declare short_name: string;

  @Column
  declare city?: string;

  @Column
  declare jersey_color?: string;

  @Column
  declare home_ground?: string;

  @Column(DataType.INTEGER)
  declare founded_year?: number;

  @Column(DataType.TEXT)
  declare description?: string;

  @Column
  declare captain_name?: string;

  @Column
  declare captain_email?: string;

  @ForeignKey(() => Player)
  @Column(DataType.INTEGER)
  declare captain_id?: number;

  @BelongsTo(() => Player, 'captain_id')
  declare captain?: Player;

  @ForeignKey(() => Player)
  @Column(DataType.INTEGER)
  declare wicket_keeper_id?: number;

  @BelongsTo(() => Player, 'wicket_keeper_id')
  declare wicket_keeper?: Player;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare user_id?: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare created_by?: number;

  @BelongsTo(() => User, 'created_by')
  declare creator?: User;

  @BelongsToMany(() => Player, () => TeamPlayer)
  declare players: Player[];
}
