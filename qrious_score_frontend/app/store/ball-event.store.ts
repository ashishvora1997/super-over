import { create } from "zustand";
import { Innings } from "@/app/types/innings.types";
import {
  BallEvent,
  CreateBallEventPayload,
  ScorecardData,
} from "@/app/types/ball-event.types";
import {
  recordBall,
  getBallEventsByInnings,
  undoLastBall,
  getScorecard,
} from "@/app/services/ball-event.service";
import { getInningsById } from "@/app/services/innings.service";

interface BallEventState {
  ballEvents: BallEvent[];
  currentInnings: Innings | null;
  scorecard: ScorecardData | null;
  loading: boolean;
  recording: boolean;

  fetchInnings: (inningsId: number) => Promise<void>;
  fetchBallEvents: (inningsId: number) => Promise<void>;
  fetchScorecard: (inningsId: number) => Promise<void>;
  recordBall: (payload: CreateBallEventPayload) => Promise<void>;
  undoLast: (inningsId: number) => Promise<void>;
  reset: () => void;
}

export const useBallEventStore = create<BallEventState>((set, get) => ({
  ballEvents: [],
  currentInnings: null,
  scorecard: null,
  loading: false,
  recording: false,

  fetchInnings: async (inningsId) => {
    try {
      const res = await getInningsById(inningsId);
      set({ currentInnings: res.data });
    } catch (err) {
      console.error("Failed to fetch innings:", err);
    }
  },

  fetchBallEvents: async (inningsId) => {
    set({ loading: true });
    try {
      const res = await getBallEventsByInnings(inningsId);
      set({ ballEvents: Array.isArray(res.data) ? res.data : [] });
    } catch {
      set({ ballEvents: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchScorecard: async (inningsId) => {
    try {
      const res = await getScorecard(inningsId);
      set({ scorecard: res.data });
    } catch {
      set({ scorecard: null });
    }
  },

  recordBall: async (payload) => {
    set({ recording: true });
    try {
      const res = await recordBall(payload);
      const { ballEvent, innings } = res.data;
      set((state) => ({
        ballEvents: [...state.ballEvents, ballEvent],
        currentInnings: innings,
      }));
      await get().fetchScorecard(payload.innings_id);
    } finally {
      set({ recording: false });
    }
  },

  undoLast: async (inningsId) => {
    set({ recording: true });
    try {
      const res = await undoLastBall(inningsId);
      set((state) => ({
        ballEvents: state.ballEvents.slice(0, -1),
        currentInnings: res.data.innings,
      }));
      await get().fetchScorecard(inningsId);
    } finally {
      set({ recording: false });
    }
  },

  reset: () =>
    set({
      ballEvents: [],
      currentInnings: null,
      scorecard: null,
      loading: false,
      recording: false,
    }),
}));
