import { WhereOptions } from 'sequelize';
import { Player } from '../players.model';

export interface FindPlayersQuery {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
}

export type PlayerWhereOptions = WhereOptions<Player>;
