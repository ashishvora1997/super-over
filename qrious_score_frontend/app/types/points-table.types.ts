export interface PointsTableEntry {
  id: number;
  tournament_id: number;
  team_id: number;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  no_results: number;
  points: number;
  runs_scored: number;
  balls_faced: number;
  runs_conceded: number;
  balls_bowled: number;
  net_run_rate: number | null;
  team: {
    id: number;
    name: string;
    short_name: string;
  };
}
