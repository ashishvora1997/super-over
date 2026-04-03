export type TournamentStatus = "upcoming" | "ongoing";

export interface Tournament {
  id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  teams: { id: number; name: string; city?: string }[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateTournamentPayload {
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
}

export interface UpdateTournamentPayload extends Partial<CreateTournamentPayload> {
  id: number;
}

export interface AssignTournamentTeamsPayload {
  tournament_id: number;
  team_ids: number[];
}
