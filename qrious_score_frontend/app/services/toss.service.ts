import { SuccessResponse } from "../types/api.types";
import { CreateTossPayload, Toss } from "../types/toss.types";
import { api } from "./api";

export const createToss = async (
  matchId: number,
  payload: CreateTossPayload,
): Promise<SuccessResponse<Toss>> => {
  const res = await api.post(`/matches/${matchId}/toss`, payload);
  return res.data;
};

export const getTossByMatch = async (
  matchId: number,
): Promise<SuccessResponse<Toss>> => {
  const res = await api.get(`/matches/${matchId}/toss`);
  return res.data;
};
