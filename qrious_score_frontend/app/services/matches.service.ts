import {
  Match,
  CreateMatchPayload,
  UpdateMatchPayload,
} from "@/app/types/match.types";
import { api } from "./api";
import { SuccessResponse } from "@/app/types/api.types";

export const getMatches = async (
  tournament_id?: number,
): Promise<SuccessResponse<Match[]>> => {
  const res = await api.get("/matches", {
    params: tournament_id ? { tournament_id } : {},
  });
  return res.data;
};

export const createMatch = async (
  payload: CreateMatchPayload,
): Promise<SuccessResponse<Match>> => {
  const res = await api.post("/matches", payload);
  return res.data;
};

export const updateMatch = async (
  payload: UpdateMatchPayload,
): Promise<SuccessResponse<Match>> => {
  const { id, ...body } = payload;
  const res = await api.patch(`/matches/${id}`, body);
  return res.data;
};

export const deleteMatch = async (
  id: number,
): Promise<SuccessResponse<null>> => {
  const res = await api.delete(`/matches/${id}`);
  return res.data;
};
