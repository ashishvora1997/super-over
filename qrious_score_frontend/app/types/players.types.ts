export interface Player {
  id: number;
  name: string;
  role: string;
  batting_style?: string;
  bowling_style?: string;
  user_id?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerState {
  players: Player[];
  total: number;
  loading: boolean;
  search: string;
  page: number;
  pageSize: number;
  role: string;

  fetchPlayers: (
    search?: string,
    page?: number,
    role?: string,
  ) => Promise<void>;
  createPlayer: (data: Partial<Player>) => Promise<any>;
  updatePlayer: (id: number, data: Partial<Player>) => Promise<any>;
  deletePlayer: (id: number) => Promise<any>;
}
