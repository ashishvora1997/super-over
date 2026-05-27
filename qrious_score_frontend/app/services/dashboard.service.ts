import { api } from "./api";

export interface MyTeam {
  id: number;
  name: string;
  role: string;
  match_count: number;
}

export interface MyMatch {
  id: number;
  team_a_id: number;
  team_b_id: number;
  teamA: { id: number; name: string };
  teamB: { id: number; name: string };
  match_date: string;
  venue: string | null;
  status: "live" | "scheduled" | "completed";
  result: string | null;
  winner_team_id: number | null;
  tournament: { id: number; name: string } | null;
}

export interface RecentFormEntry {
  match_id: number;
  result: "W" | "L" | "T" | "NR";
  opponent_name: string;
}

export interface Highlights {
  highestScore: { runs: number; opponent: string } | null;
  bestBowling: { figures: string; opponent: string } | null;
  catches: number;
}

export interface DashboardStats {
  runsThisSeason: number;
  battingAverage: number;
  strikeRate: number;
  wicketsTaken: number;
  myTeams: MyTeam[];
  myMatches: MyMatch[];
  recentForm: RecentFormEntry[];
  highlights: Highlights;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/users/me/dashboard");
  return res.data.data;
};
