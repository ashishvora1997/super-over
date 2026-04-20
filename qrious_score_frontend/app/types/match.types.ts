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
  winner_team_id?: number | null;
}

export interface UpdateMatchPayload extends Partial<CreateMatchPayload> {
  id: number;
  status?: MatchStatus;
  winner_team_id?: number | null;
}
