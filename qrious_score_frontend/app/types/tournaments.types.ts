export type TournamentStatus = "upcoming" | "ongoing" | "completed";

export interface TournamentTeam {
  id: number;
  name: string;
  city?: string;
}

export interface Tournament {
  id: number;
  name: string;
  city: string;
  location: string;
  organiser_name?: string;
  organiser_email?: string;
  created_by?: number;
  start_date: string;
  end_date: string;
  status: TournamentStatus;

  teams: TournamentTeam[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentPayload {
  name: string;
  city: string;
  organiser_name: string;
  organiser_email: string;
  start_date: string;
  end_date: string;
}

export interface UpdateTournamentPayload extends Partial<CreateTournamentPayload> {
  id: number;
}

export interface AssignTournamentTeamsPayload {
  tournament_id: number;
  team_ids: number[];
}

export interface TournamentRules {
  id?: number;
  tournament_id: number;
  wide_runs: number;
  no_ball_runs: number;
  count_wide_as_legal_delivery: boolean;
  count_no_ball_as_legal_delivery: boolean;
  ignore_wide_rule: boolean;
  ignore_no_ball_rule: boolean;
}

export interface UpsertTournamentRulesPayload extends Partial<TournamentRules> {
  tournament_id: number;
}

export interface TournamentScorer {
  id: number;
  tournament_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AddTournamentScorerPayload {
  tournament_id: number;
  email: string;
}

export interface RemoveTournamentScorerPayload {
  tournament_id: number;
  user_id: number;
}
