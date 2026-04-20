import { SuccessResponse } from "../types/api.types";
import {
  Innings,
  StartInningsPayload,
  UpdateInningsPlayersPayload,
} from "../types/innings.types";
import { api } from "./api";

export const getInningsByMatch = async (
  matchId: number,
): Promise<SuccessResponse<Innings[]>> => {
  const res = await api.get(`/innings/match/${matchId}`);
  return res.data;
};

export const getInningsById = async (
  inningsId: number,
): Promise<SuccessResponse<Innings>> => {
  const res = await api.get(`/innings/${inningsId}`);
  return res.data;
};

export const startInnings = async (
  inningsId: number,
  payload: StartInningsPayload,
): Promise<SuccessResponse<Innings>> => {
  const res = await api.post(`/innings/${inningsId}/start`, payload);
  return res.data;
};

export const updateInningsPlayers = async (
  inningsId: number,
  payload: UpdateInningsPlayersPayload,
): Promise<SuccessResponse<Innings>> => {
  const res = await api.patch(`/innings/${inningsId}/players`, payload);
  return res.data;
};
