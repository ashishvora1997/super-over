export type TossElection = "bat" | "bowl";

export interface Toss {
  id: number;
  match_id: number;
  toss_winner_team_id: number;
  elected_to: TossElection;
  tossWinnerTeam?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTossPayload {
  toss_winner_team_id: number;
  elected_to: TossElection;
}
