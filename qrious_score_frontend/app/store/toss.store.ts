import { create } from "zustand";
import { Toss, CreateTossPayload } from "@/app/types/toss.types";
import { createToss, getTossByMatch } from "@/app/services/toss.service";

interface TossState {
  toss: Toss | null;
  loading: boolean;

  fetchToss: (matchId: number) => Promise<void>;
  recordToss: (matchId: number, payload: CreateTossPayload) => Promise<void>;
  reset: () => void;
}

export const useTossStore = create<TossState>((set) => ({
  toss: null,
  loading: false,

  fetchToss: async (matchId) => {
    set({ loading: true });
    try {
      const res = await getTossByMatch(matchId);
      set({ toss: res.data });
    } catch {
      set({ toss: null });
    } finally {
      set({ loading: false });
    }
  },

  recordToss: async (matchId, payload) => {
    const res = await createToss(matchId, payload);
    set({ toss: res.data });
  },

  reset: () => set({ toss: null, loading: false }),
}));
