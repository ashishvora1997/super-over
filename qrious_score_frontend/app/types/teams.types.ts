import { SuccessResponse } from "./api.types";

export interface Team {
  id: number;
  name: string;
  short_name: string;
  city?: string;
  jersey_color?: string;
  home_ground?: string;
  founded_year?: number;
  description?: string;
  captain_id?: number;

  captain?: {
    id: number;
    name: string;
  };

  players?: {
    id: number;
    name: string;
  }[];

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

  createTeam: (data: Partial<Team>) => Promise<SuccessResponse<Team>>;
  updateTeam: (
    id: number,
    data: Partial<Team>,
  ) => Promise<SuccessResponse<Team>>;
  deleteTeam: (id: number) => Promise<SuccessResponse<null>>;

  updateCaptainInStore: (team_id: number, player_id: number) => void;
}
