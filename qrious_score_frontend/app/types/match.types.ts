export type MatchStatus = "scheduled" | "live" | "completed";

export interface Match {
  id: number;
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  match_date: string;
  venue: string;
  status: MatchStatus;
  winner_team_id: number | null;
  overs_per_side?: number;

  tournament?: { id: number; name: string };
  teamA?: {
    id: number;
    name: string;
    players?: { id: number; name: string }[];
  };
  teamB?: {
    id: number;
    name: string;
    players?: { id: number; name: string }[];
  };
  winner?: { id: number; name: string } | null;
}

export interface CreateMatchPayload {
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  match_date: string;
  venue: string;
  overs_per_side?: number;
  winner_team_id?: number | null;
}

export interface UpdateMatchPayload extends Partial<CreateMatchPayload> {
  id: number;
  status?: MatchStatus;
  winner_team_id?: number | null;
}

export interface MatchState {
  matches: Match[];
  matchesList: Match[];
  loading: boolean;
  tournamentFilter: number | undefined;

  fetchMatches: (tournament_id?: number) => Promise<void>;
  fetchMatchesList: () => Promise<void>;
  createMatch: (payload: CreateMatchPayload) => Promise<void>;
  updateMatch: (payload: UpdateMatchPayload) => Promise<void>;
  deleteMatch: (id: number) => Promise<void>;
  setTournamentFilter: (id: number | undefined) => void;
}
