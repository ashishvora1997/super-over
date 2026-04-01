import { api } from "./api";

export const getTeams = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await api.get("/teams", { params });
  return res.data;
};

export const createTeam = async (data: any) => {
  const res = await api.post("/teams", data);
  return res.data;
};

export const updateTeam = async (id: number, data: any) => {
  const res = await api.patch(`/teams/${id}`, data);
  return res.data;
};

export const deleteTeam = async (id: number) => {
  const res = await api.delete(`/teams/${id}`);
  return res.data;
};

export const assignPlayers = async (data: {
  team_id: number;
  player_ids: number[];
}) => {
  const res = await api.post("/teams/assign-players", data);
  return res.data;
};
