export interface Team {
  id: number;
  name: string;
  city?: string;
  logo?: string;
  user_id?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamState {
  teams: Team[];
  total: number;
  loading: boolean;
  search: string;
  page: number;
  pageSize: number;

  fetchTeams: (search?: string, page?: number) => Promise<void>;
  createTeam: (data: Partial<Team>) => Promise<any>;
  updateTeam: (id: number, data: Partial<Team>) => Promise<any>;
  deleteTeam: (id: number) => Promise<any>;
}
