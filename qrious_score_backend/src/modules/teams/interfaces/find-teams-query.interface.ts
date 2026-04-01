import { WhereOptions } from 'sequelize';
import { Team } from '../teams.model';

export interface FindTeamsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export type TeamWhereOptions = WhereOptions<Team>;
