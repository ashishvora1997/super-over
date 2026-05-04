export type MatchStatus = "scheduled" | "live" | "completed";
export type MatchResult = "win" | "tie" | "no_result" | "super_over" | "draw" | null;

export interface Match {
  id: number;
  tournament_id: number;
  team_a_id: number;
  team_b_id: number;
  match_date: string;
  venue: string;
  status: MatchStatus;
  winner_team_id: number | null;
  result: MatchResult;
  is_super_over: boolean;
  super_over_number: number;
  super_over_chasing_team_id?: number;
  overs_per_side?: number;

  tournament?: { id: number; name: string };
  teamA?: {
    id: number;
    name: string;
    wicket_keeper_id?: number;
    players?: { id: number; name: string }[];
  };
  teamB?: {
    id: number;
    name: string;
    wicket_keeper_id?: number;
    players?: { id: number; name: string }[];
  };
  winner?: { id: number; name: string } | null;
  innings?: {
    id: number;
    innings_number: number;
    batting_team_id: number;
    total_runs: number;
    wickets: number;
    overs: number;
    balls: number;
    status: string;
    is_super_over: boolean;
  }[];
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
