import { create } from "zustand";
import {
  Match,
  CreateMatchPayload,
  UpdateMatchPayload,
} from "@/app/types/match.types";
import {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/app/services/matches.service";

interface MatchState {
  matches: Match[];
  loading: boolean;
  tournamentFilter: number | undefined;

  fetchMatches: (tournament_id?: number) => Promise<void>;
  createMatch: (payload: CreateMatchPayload) => Promise<void>;
  updateMatch: (payload: UpdateMatchPayload) => Promise<void>;
  deleteMatch: (id: number) => Promise<void>;
  setTournamentFilter: (id: number | undefined) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  loading: false,
  tournamentFilter: undefined,

  fetchMatches: async (tournament_id?: number) => {
    set({ loading: true });

    try {
      const response = await getMatches(tournament_id);
      set({
        matches: Array.isArray(response.data) ? response.data : [],
      });
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      set({ matches: [] });
    } finally {
      set({ loading: false });
    }
  },

  createMatch: async (payload: CreateMatchPayload) => {
    await createMatch(payload);
    await get().fetchMatches(get().tournamentFilter);
  },

  updateMatch: async (payload: UpdateMatchPayload) => {
    await updateMatch(payload);
    await get().fetchMatches(get().tournamentFilter);
  },

  deleteMatch: async (id: number) => {
    await deleteMatch(id);
    await get().fetchMatches(get().tournamentFilter);
  },

  setTournamentFilter: (id: number | undefined) => {
    set({ tournamentFilter: id });
  },
}));
