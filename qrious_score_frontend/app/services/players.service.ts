import { api } from "./api";

export const getPlayers = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
}) => {
  const res = await api.get("/players", { params });
  return res.data;
};

export const createPlayer = async (data: any) => {
  const res = await api.post("/players", data);
  return res.data;
};

export const updatePlayer = async (id: number, data: any) => {
  const res = await api.patch(`/players/${id}`, data);
  return res.data;
};

export const deletePlayer = async (id: number) => {
  const res = await api.delete(`/players/${id}`);
  return res.data;
};
