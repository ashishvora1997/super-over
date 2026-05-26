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

export const getTournament = (
  id: number,
): Promise<{ success: boolean; message: string; data: Tournament }> =>
  api.get(`/tournaments/${id}`).then((r) => r.data);


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

export const removeTeamFromTournament = (
  tournamentId: number,
  teamId: number,
): Promise<{ success: boolean; message: string; data: null }> =>
  api
    .delete(`/tournaments/${tournamentId}/teams/${teamId}`)
    .then((r) => r.data);

import {
  TournamentRules,
  UpsertTournamentRulesPayload,
  TournamentScorer,
  AddTournamentScorerPayload,
  RemoveTournamentScorerPayload,
} from "../types/tournaments.types";

export const getTournamentRules = (
  id: number,
): Promise<{ success: boolean; message: string; data: TournamentRules }> =>
  api.get(`/tournaments/${id}/rules`).then((r) => r.data);

export const upsertTournamentRules = (
  payload: UpsertTournamentRulesPayload,
): Promise<{ success: boolean; message: string; data: TournamentRules }> =>
  api.post(`/tournaments/rules`, payload).then((r) => r.data);

export const getTournamentScorers = (
  id: number,
): Promise<{ success: boolean; message: string; data: TournamentScorer[] }> =>
  api.get(`/tournaments/${id}/scorers`).then((r) => r.data);

export const addTournamentScorer = (
  payload: AddTournamentScorerPayload,
): Promise<{ success: boolean; message: string; data: TournamentScorer }> =>
  api.post(`/tournaments/scorers/add`, payload).then((r) => r.data);

export const removeTournamentScorer = (
  payload: RemoveTournamentScorerPayload,
): Promise<{ success: boolean; message: string; data: null }> =>
  api.post(`/tournaments/scorers/remove`, payload).then((r) => r.data);
