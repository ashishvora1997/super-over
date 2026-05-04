import { PointsTableEntry } from "../types/points-table.types";
import { api } from "./api";

export interface PointsTableResponse {
  success: boolean;
  message: string;
  data: PointsTableEntry[];
}

export const getStandings = (
  tournamentId: number,
): Promise<PointsTableResponse> =>
  api.get(`/points-table/${tournamentId}`).then((r) => r.data);
