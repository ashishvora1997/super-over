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

  fetchMatches: async (tournament_id) => {
    set({ loading: true });
    try {
      const data = await getMatches(tournament_id);
      set({ matches: data });
    } finally {
      set({ loading: false });
    }
  },

  createMatch: async (payload) => {
    await createMatch(payload);
    await get().fetchMatches(get().tournamentFilter);
  },

  updateMatch: async (payload) => {
    await updateMatch(payload);
    await get().fetchMatches(get().tournamentFilter);
  },

  deleteMatch: async (id) => {
    await deleteMatch(id);
    await get().fetchMatches(get().tournamentFilter);
  },

  setTournamentFilter: (id) => {
    set({ tournamentFilter: id });
  },
}));
