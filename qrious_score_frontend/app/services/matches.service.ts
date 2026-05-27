import {
  Match,
  MatchRules,
  CreateMatchPayload,
  UpdateMatchPayload,
  UpdateMatchRulesPayload,
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

export const getMatchesList = async (): Promise<SuccessResponse<Match[]>> => {
  const res = await api.get("/matches/list");
  return res.data;
};

export const getMatchById = async (
  id: number,
): Promise<SuccessResponse<Match>> => {
  const res = await api.get(`/matches/${id}`);
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

export const getMatchRules = async (
  matchId: number,
): Promise<SuccessResponse<MatchRules>> => {
  const res = await api.get(`/matches/${matchId}/rules`);
  return res.data;
};

export const updateMatchRules = async (
  matchId: number,
  payload: UpdateMatchRulesPayload,
): Promise<SuccessResponse<MatchRules>> => {
  const res = await api.patch(`/matches/${matchId}/rules`, payload);
  return res.data;
};

export const getMatchScorers = async (
  matchId: number,
): Promise<SuccessResponse<{ id: number; name: string; email: string }[]>> => {
  const res = await api.get(`/matches/${matchId}/scorers`);
  return res.data;
};

export const addMatchScorer = async (
  matchId: number,
  email: string,
): Promise<SuccessResponse<null>> => {
  const res = await api.post(`/matches/scorers/add`, {
    match_id: matchId,
    email,
  });
  return res.data;
};

export const removeMatchScorer = async (
  matchId: number,
  userId: number,
): Promise<SuccessResponse<null>> => {
  const res = await api.post(`/matches/scorers/remove`, {
    match_id: matchId,
    user_id: userId,
  });
  return res.data;
};

export const takeoverScoring = async (
  matchId: number,
): Promise<SuccessResponse<Match>> => {
  const res = await api.post(`/matches/${matchId}/takeover`);
  return res.data;
};

export const transferScoring = async (
  matchId: number,
  targetUserId: number,
): Promise<SuccessResponse<Match>> => {
  const res = await api.post(`/matches/${matchId}/transfer`, {
    target_user_id: targetUserId,
  });
  return res.data;
};

export const getActiveScoringSession = async (): Promise<
  SuccessResponse<{
    id: number;
    teamA?: { name: string };
    teamB?: { name: string };
  } | null>
> => {
  const res = await api.get("/matches/active-session");
  return res.data;
};
