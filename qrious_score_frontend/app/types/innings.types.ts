export type InningsStatus = "not_started" | "in_progress" | "completed";

export interface Innings {
  id: number;
  match_id: number;
  innings_number: number;
  batting_team_id: number;
  bowling_team_id: number;
  striker_id: number | null;
  non_striker_id: number | null;
  bowler_id: number | null;
  total_runs: number;
  wickets: number;
  overs: number;
  balls: number;
  status: InningsStatus;
  is_super_over: boolean;
  super_over_number: number;
  max_wickets: number;
  battingTeam?: { id: number; name: string };
  bowlingTeam?: { id: number; name: string };
  striker?: { id: number; name: string } | null;
  nonStriker?: { id: number; name: string } | null;
  bowler?: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartInningsPayload {
  striker_id: number;
  non_striker_id: number;
  bowler_id: number;
}

export interface UpdateInningsPlayersPayload {
  striker_id?: number;
  non_striker_id?: number;
  bowler_id?: number;
}
