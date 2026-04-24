export type ExtraType = "wide" | "no_ball" | "bye" | "leg_bye";

export type WicketType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket"
  | "retired_hurt";

export interface BallEvent {
  id: number;
  innings_id: number;
  over_number: number;
  ball_number: number;
  striker_id: number;
  non_striker_id: number;
  bowler_id: number;
  runs_bat: number;
  runs_extra: number;
  extra_type: ExtraType | null;
  is_wicket: boolean;
  wicket_type: WicketType | null;
  dismissed_player_id: number | null;
  fielder_id: number | null;
  is_legal: boolean;
  metadata: Record<string, unknown> | null;
  striker?: { id: number; name: string } | null;
  nonStriker?: { id: number; name: string } | null;
  bowler?: { id: number; name: string } | null;
  dismissedPlayer?: { id: number; name: string } | null;
  fielder?: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBallEventPayload {
  innings_id: number;
  striker_id: number;
  non_striker_id: number;
  bowler_id: number;
  runs_bat: number;
  extra_type?: ExtraType;
  runs_extra?: number;
  is_wicket?: boolean;
  wicket_type?: WicketType;
  dismissed_player_id?: number;
  fielder_id?: number;
  metadata?: Record<string, unknown>;
}

export interface BatterStats {
  player_id: number;
  player_name: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  is_out: boolean;
  wicket_type: string | null;
  bowler_name: string | null;
  fielder_name: string | null;
}

export interface BowlerStats {
  player_id: number;
  player_name: string;
  overs: string;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  extras: number;
}

export interface ExtrasStats {
  wides: number;
  no_balls: number;
  byes: number;
  leg_byes: number;
  total: number;
}

export interface ScorecardData {
  batting: BatterStats[];
  bowling: BowlerStats[];
  extras: ExtrasStats;
}
