import { create } from "zustand";
import {
  createPlayer as createPlayerAPI,
  updatePlayer as updatePlayerAPI,
  deletePlayer as deletePlayerAPI,
  getPlayers,
  getPlayersList,
} from "../services/players.service";
import { Player, PlayerState } from "../types/players.types";

export const usePlayerStore = create<PlayerState>((set, get) => ({
  players: [],
  playersList: [],
  total: 0,
  loading: false,
  search: "",
  page: 1,
  pageSize: 10,
  role: "all",

  fetchPlayers: async (search = "", page = 1, role = get().role) => {
    set({ loading: true, search, page, role });

    try {
      const apiResponse = await getPlayers({
        search,
        page,
        limit: get().pageSize,
        role,
      });

      const playersData = apiResponse.data || [];
      const meta = apiResponse.meta || {};

      set({
        players: playersData,
        total: meta.total || 0,
        page: meta.page || page,
        pageSize: meta.pageSize || get().pageSize,
      });
    } catch (error) {
      console.error("Failed to fetch players:", error);
      set({ players: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchPlayersList: async () => {
    try {
      const apiResponse = await getPlayersList();

      set({
        playersList: apiResponse.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch players list:", error);
      set({ playersList: [] });
    }
  },

  createPlayer: async (data: Partial<Player>) => {
    set({ loading: true });

    try {
      const res = await createPlayerAPI(data);
      await get().fetchPlayers(get().search, get().page);
      return res;
    } catch (error) {
      console.error("Create player failed", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePlayer: async (id: number, data: Partial<Player>) => {
    set({ loading: true });

    try {
      const res = await updatePlayerAPI(id, data);
      await get().fetchPlayers(get().search, get().page);
      return res;
    } catch (error) {
      console.error("Update player failed", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deletePlayer: async (id: number) => {
    set({ loading: true });

    try {
      const res = await deletePlayerAPI(id);

      await get().fetchPlayers(get().search, get().page, get().role);

      return res;
    } catch (error) {
      console.error("Delete player failed", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
