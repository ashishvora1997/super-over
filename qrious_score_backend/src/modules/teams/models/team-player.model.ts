import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { Team } from './teams.model';
import { Player } from 'src/modules/players/models/players.model';

@Table({ tableName: 'team_players' })
export class TeamPlayer extends Model {
  @ForeignKey(() => Team)
  @Column
  team_id!: number;

  @ForeignKey(() => Player)
  @Column
  player_id!: number;
}
