import { create } from "zustand";
import {
  fetchDashboardStats,
  DashboardStats,
} from "../services/dashboard.service";

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await fetchDashboardStats();
      set({ stats });
    } catch {
      set({ error: "Failed to load dashboard stats" });
    } finally {
      set({ loading: false });
    }
  },
}));
