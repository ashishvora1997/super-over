import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';

import { Tournament } from './tournament.model';
import { Team } from '../teams/teams.model';

@Table({ tableName: 'tournament_teams' })
export class TournamentTeam extends Model {
  @ForeignKey(() => Tournament)
  @Column
  declare tournament_id: number;

  @ForeignKey(() => Team)
  @Column
  declare team_id: number;
}
