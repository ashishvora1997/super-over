import { create } from "zustand";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  setCaptain as setCaptainAPI,
} from "../services/teams.service";
import { Team, TeamState } from "../types/teams.types";
import { SuccessResponse } from "@/app/types/api.types";

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
        pageSize: res.meta?.pageSize || get().pageSize,
      });
    } finally {
      set({ loading: false });
    }
  },

  createTeam: async (data: Partial<Team>): Promise<SuccessResponse<Team>> => {
    set({ loading: true });

    try {
      const res = await createTeam(data);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },

  updateTeam: async (
    id: number,
    data: Partial<Team>,
  ): Promise<SuccessResponse<Team>> => {
    set({ loading: true });

    try {
      const res = await updateTeam(id, data);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },

  deleteTeam: async (id: number): Promise<SuccessResponse<null>> => {
    set({ loading: true });

    try {
      const res = await deleteTeam(id);
      await get().fetchTeams(get().search, get().page);
      return res;
    } finally {
      set({ loading: false });
    }
  },

  updateCaptainInStore: (teamId: number, playerId: number) => {
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, captain_id: playerId } : t,
      ),
    }));
  },
}));
