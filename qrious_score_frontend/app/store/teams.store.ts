import { create } from "zustand";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../services/teams.service";
import { TeamState } from "../types/teams.types";

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  total: 0,
  loading: false,
  search: "",
  page: 1,
  pageSize: 10,

  fetchTeams: async (search = "", page = 1) => {
    set({ loading: true, search, page });

    try {
      const res = await getTeams({
        search,
        page,
        limit: get().pageSize,
      });

      set({
        teams: res.data || [],
        total: res.meta?.total || 0,
        page: res.meta?.page || page,
      });
    } finally {
      set({ loading: false });
    }
  },

  createTeam: async (data) => {
    set({ loading: true });

    try {
      const res = await createTeam(data);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (id, data) => {
    set({ loading: true });

    try {
      const res = await updateTeam(id, data);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id) => {
    set({ loading: true });

    try {
      const res = await deleteTeam(id);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },
}));
