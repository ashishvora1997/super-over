import { create } from "zustand";
import { MatchState } from "@/app/types/match.types";
import {
  CreateMatchPayload,
  UpdateMatchPayload,
} from "@/app/types/match.types";
import {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getMatchesList,
} from "@/app/services/matches.service";

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  matchesList: [],
  loading: false,
  tournamentFilter: undefined,

  fetchMatches: async (tournament_id?: number) => {
    set({ loading: true });

    try {
      const res = await getMatches(tournament_id);
      set({ matches: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      set({ matches: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchMatchesList: async () => {
    try {
      const res = await getMatchesList();
      set({ matchesList: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      console.error("Failed to fetch matches list:", error);
      set({ matchesList: [] });
    }
  },

  createMatch: async (payload: CreateMatchPayload) => {
    set({ loading: true });

    try {
      await createMatch(payload);
      await get().fetchMatches(get().tournamentFilter);
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateMatch: async (payload: UpdateMatchPayload) => {
    set({ loading: true });

    try {
      await updateMatch(payload);
      await get().fetchMatches(get().tournamentFilter);
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteMatch: async (id: number) => {
    set({ loading: true });

    try {
      await deleteMatch(id);
      await get().fetchMatches(get().tournamentFilter);
    } finally {
      set({ loading: false });
    }
  },

  setTournamentFilter: (id: number | undefined) => {
    set({ tournamentFilter: id });
  },
}));
