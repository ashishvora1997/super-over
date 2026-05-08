import { create } from "zustand";
import {
  Innings,
  StartInningsPayload,
  UpdateInningsPlayersPayload,
} from "@/app/types/innings.types";
import {
  getInningsByMatch,
  startInnings,
  updateInningsPlayers,
} from "@/app/services/innings.service";

interface InningsState {
  innings: Innings[];
  loading: boolean;

  fetchInnings: (matchId: number) => Promise<void>;
  startInnings: (
    inningsId: number,
    payload: StartInningsPayload,
    matchId: number,
  ) => Promise<void>;
  updateInningsPlayers: (
    inningsId: number,
    payload: UpdateInningsPlayersPayload,
    matchId: number,
  ) => Promise<void>;
  updateInningsInArray: (updatedInnings: Innings) => void;
  reset: () => void;
}

export const useInningsStore = create<InningsState>((set, get) => ({
  innings: [],
  loading: false,

  fetchInnings: async (matchId) => {
    set({ loading: true });
    try {
      const res = await getInningsByMatch(matchId);
      set({ innings: Array.isArray(res.data) ? res.data : [] });
    } catch {
      set({ innings: [] });
    } finally {
      set({ loading: false });
    }
  },

  startInnings: async (inningsId, payload, matchId) => {
    await startInnings(inningsId, payload);
    await get().fetchInnings(matchId);
  },

  updateInningsPlayers: async (inningsId, payload, matchId) => {
    await updateInningsPlayers(inningsId, payload);
    await get().fetchInnings(matchId);
  },

  updateInningsInArray: (updatedInnings: Innings) => {
    set((state) => ({
      innings: state.innings.map((inn) =>
        inn.id === updatedInnings.id ? updatedInnings : inn
      ),
    }));
  },

  reset: () => set({ innings: [], loading: false }),
}));
