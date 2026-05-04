import { create } from "zustand";
import { PointsTableEntry } from "../types/points-table.types";
import { getStandings } from "../services/points-table.service";

interface PointsTableState {
  standings: PointsTableEntry[];
  loading: boolean;
  error: string | null;

  fetchStandings: (tournamentId: number) => Promise<void>;
  clearStandings: () => void;
}

export const usePointsTableStore = create<PointsTableState>((set) => ({
  standings: [],
  loading: false,
  error: null,

  fetchStandings: async (tournamentId: number) => {
    set({ loading: true, error: null });
    try {
      const res = await getStandings(tournamentId);
      set({ standings: res.data });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load standings";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  clearStandings: () => {
    set({ standings: [], error: null });
  },
}));
