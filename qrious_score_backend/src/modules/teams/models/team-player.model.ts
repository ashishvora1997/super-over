import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Team } from './teams.model';
import { Player } from 'src/modules/players/models/players.model';

@Table({ tableName: 'team_players' })
export class TeamPlayer extends Model {
  @ForeignKey(() => Team)
  @Column
  declare team_id: number;

  @ForeignKey(() => Player)
  @Column
  declare player_id: number;

  @BelongsTo(() => Player)
  declare player: Player;

  @BelongsTo(() => Team)
  declare team: Team;
}
