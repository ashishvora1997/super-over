import { api } from "./api";
import { Team } from "../types/teams.types";
import { SuccessResponse } from "@/app/types/api.types";

interface GetTeamsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const getTeams = async (
  params?: GetTeamsParams,
): Promise<SuccessResponse<Team[]>> => {
  const res = await api.get("/teams", { params });
  return res.data;
};

export const getTeamById = async (
  id: number,
): Promise<SuccessResponse<Team>> => {
  const res = await api.get(`/teams/${id}`);
  return res.data;
};

export const getTeamsList = async (): Promise<SuccessResponse<Team[]>> => {
  const res = await api.get("/teams/list");
  return res.data;
};

export const createTeam = async (
  data: Partial<Team>,
): Promise<SuccessResponse<Team>> => {
  const res = await api.post("/teams", data);
  return res.data;
};

export const updateTeam = async (
  id: number,
  data: Partial<Team>,
): Promise<SuccessResponse<Team>> => {
  const res = await api.patch(`/teams/${id}`, data);
  return res.data;
};

export const deleteTeam = async (
  id: number,
): Promise<SuccessResponse<null>> => {
  const res = await api.delete(`/teams/${id}`);
  return res.data;
};

export const removePlayerFromTeam = async (
  teamId: number,
  playerId: number,
): Promise<SuccessResponse<null>> => {
  const res = await api.delete(`/teams/${teamId}/players/${playerId}`);
  return res.data;
};

export const setCaptain = async (data: {
  team_id: number;
  player_id: number | null;
}): Promise<SuccessResponse<Team>> => {
  const res = await api.post("/teams/set-captain", data);
  return res.data;
};

export const setWicketKeeper = async (data: {
  team_id: number;
  player_id: number | null;
}): Promise<SuccessResponse<Team>> => {
  const res = await api.post("/teams/set-wicket-keeper", data);
  return res.data;
};

export const addPlayerByEmail = async (data: {
  team_id: number;
  email: string;
}): Promise<SuccessResponse<unknown>> => {
  const res = await api.post("/teams/add-player-by-email", data);
  return res.data;
};
