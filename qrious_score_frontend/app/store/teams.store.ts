import { create } from "zustand";
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  setCaptain as setCaptainAPI,
  getTeamsList,
} from "../services/teams.service";
import { Team, TeamState } from "../types/teams.types";
import { SuccessResponse } from "@/app/types/api.types";

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  teamsList: [],
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

  fetchTeamById: async (id: number) => {
    try {
      const res = await getTeamById(id);
      const fullTeam = res.data;

      set((state) => {
        const exists = state.teams.some((t) => t.id === id);
        return {
          teams: exists
            ? state.teams.map((t) => (t.id === id ? fullTeam : t))
            : [...state.teams, fullTeam],
        };
      });

      return fullTeam;
    } catch (error) {
      console.error("Failed to fetch team:", error);
      return null;
    }
  },

  fetchTeamsList: async () => {
    try {
      const apiResponse = await getTeamsList();

      set({
        teamsList: apiResponse.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch players list:", error);
      set({ teamsList: [] });
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

  updateWicketKeeperInStore: (teamId: number, playerId: number) => {
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId ? { ...t, wicket_keeper_id: playerId } : t,
      ),
    }));
  },
}));
