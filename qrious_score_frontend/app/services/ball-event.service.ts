import { SuccessResponse } from "../types/api.types";
import { Innings } from "../types/innings.types";
import {
  BallEvent,
  CreateBallEventPayload,
  ScorecardData,
} from "../types/ball-event.types";
import { api } from "./api";

export const recordBall = async (
  payload: CreateBallEventPayload,
): Promise<SuccessResponse<{ ballEvent: BallEvent; innings: Innings }>> => {
  const res = await api.post("/ball-events", payload);
  return res.data;
};

export const getBallEventsByInnings = async (
  inningsId: number,
): Promise<SuccessResponse<BallEvent[]>> => {
  const res = await api.get(`/ball-events/innings/${inningsId}`);
  return res.data;
};

export const getBallEventById = async (
  id: number,
): Promise<SuccessResponse<BallEvent>> => {
  const res = await api.get(`/ball-events/${id}`);
  return res.data;
};

export const undoLastBall = async (
  inningsId: number,
): Promise<SuccessResponse<{ innings: Innings }>> => {
  const res = await api.delete(`/ball-events/innings/${inningsId}/undo`);
  return res.data;
};

export const getScorecard = async (
  inningsId: number,
): Promise<SuccessResponse<ScorecardData>> => {
  const res = await api.get(`/ball-events/innings/${inningsId}/scorecard`);
  return res.data;
};
