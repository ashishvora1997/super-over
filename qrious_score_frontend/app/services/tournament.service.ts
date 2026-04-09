import {
  Tournament,
  CreateTournamentPayload,
  UpdateTournamentPayload,
  AssignTournamentTeamsPayload,
} from "../types/tournaments.types";
import { api } from "./api";

export interface TournamentsResponse {
  success: boolean;
  message: string;
  data: Tournament[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export const getTournaments = (
  search = "",
  page = 1,
  pageSize = 10,
): Promise<TournamentsResponse> =>
  api
    .get("/tournaments", { params: { search, page, pageSize } })
    .then((r) => r.data);

export const createTournament = (
  payload: CreateTournamentPayload,
): Promise<Tournament> => api.post("/tournaments", payload).then((r) => r.data);

export const updateTournament = (
  payload: UpdateTournamentPayload,
): Promise<Tournament> => {
  const { id, ...body } = payload;

  return api.patch(`/tournaments/${id}`, body).then((r) => r.data);
};

export const deleteTournament = (id: number): Promise<void> =>
  api.delete(`/tournaments/${id}`).then((r) => r.data);

export const assignTournamentTeams = (
  payload: AssignTournamentTeamsPayload,
): Promise<void> =>
  api.post(`/tournaments/assign-teams`, payload).then((r) => r.data);
