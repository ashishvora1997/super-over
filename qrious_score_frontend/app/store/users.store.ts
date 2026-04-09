import { create } from "zustand";
import {
  getUsers as getUsersAPI,
  updateUserRole as updateUserRoleAPI,
} from "../services/users.service";
import { User } from "../types/users.types";
import { SuccessResponse } from "@/app/types/api.types";

interface UserState {
  users: User[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;

  fetchUsers: (page?: number) => Promise<void>;
  updateUserRole: (
    id: number,
    role: "viewer" | "scorer",
  ) => Promise<SuccessResponse<User>>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  total: 0,
  loading: false,
  page: 1,
  pageSize: 10,

  fetchUsers: async (page = 1) => {
    set({ loading: true, page });

    try {
      const res = await getUsersAPI({
        page,
        limit: get().pageSize,
      });

      set({
        users: res.data || [],
        total: res.meta?.total || 0,
        page: res.meta?.page || page,
        pageSize: res.meta?.pageSize || get().pageSize,
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      set({ users: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  updateUserRole: async (id, role) => {
    set({ loading: true });

    try {
      const res = await updateUserRoleAPI(id, role);

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
      }));

      return res;
    } catch (error) {
      console.error("Failed to update role:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
