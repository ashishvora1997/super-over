import { create } from "zustand";
import { Tournament } from "../types/tournaments.types";
import {
  getTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  assignTournamentTeams,
} from "../services/tournament.service";

import {
  CreateTournamentPayload,
  UpdateTournamentPayload,
  AssignTournamentTeamsPayload,
} from "../types/tournaments.types";

interface TournamentState {
  tournaments: Tournament[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;

  fetchTournaments: (search?: string, page?: number) => Promise<void>;
  createTournament: (payload: CreateTournamentPayload) => Promise<void>;
  updateTournament: (payload: UpdateTournamentPayload) => Promise<void>;
  deleteTournament: (id: number) => Promise<void>;
  assignTeams: (payload: AssignTournamentTeamsPayload) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,

  fetchTournaments: async (search = "", page = 1) => {
    set({ loading: true });
    try {
      const { pageSize } = get();
      const res = await getTournaments(search, page, pageSize);

      // ✅ Fixed: use meta object from backend
      set({
        tournaments: res.data,
        total: res.meta.total,
        page: res.meta.page,
      });
    } finally {
      set({ loading: false });
    }
  },

  createTournament: async (payload) => {
    await createTournament(payload);
    await get().fetchTournaments();
  },

  updateTournament: async (payload) => {
    await updateTournament(payload);
    await get().fetchTournaments();
  },

  deleteTournament: async (id) => {
    await deleteTournament(id);
    const { tournaments, total, page, pageSize } = get();
    const remaining = tournaments.filter((t) => t.id !== id);
    const newPage = remaining.length === 0 && page > 1 ? page - 1 : page;
    await get().fetchTournaments("", newPage);
  },

  assignTeams: async (payload) => {
    await assignTournamentTeams(payload);
    // Refetch the current page so team counts update instantly
    const { page } = get();
    await get().fetchTournaments("", page);
  },
}));
