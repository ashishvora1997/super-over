import { Player } from "../types/players.types";
import { api } from "./api";
import { SuccessResponse } from "@/app/types/api.types";

interface GetPlayersParams {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
}

export interface BulkUploadResult {
  success_count: number;
  failed_count: number;
  errors: { row: number; error: string }[];
}

export const getPlayers = async (
  params?: GetPlayersParams,
): Promise<SuccessResponse<Player[]>> => {
  const res = await api.get("/players", { params });
  return res.data;
};

export const getPlayersList = async (): Promise<SuccessResponse<Player[]>> => {
  const res = await api.get("/players/list");
  return res.data;
};

export const createPlayer = async (
  data: Partial<Player>,
): Promise<SuccessResponse<Player>> => {
  const res = await api.post("/players", data);
  return res.data;
};

export const updatePlayer = async (
  id: number,
  data: Partial<Player>,
): Promise<SuccessResponse<Player>> => {
  const res = await api.patch(`/players/${id}`, data);
  return res.data;
};

export const deletePlayer = async (
  id: number,
): Promise<SuccessResponse<null>> => {
  const res = await api.delete(`/players/${id}`);
  return res.data;
};

export const bulkUploadPlayers = async (
  file: File,
): Promise<SuccessResponse<BulkUploadResult>> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/players/bulk-upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
