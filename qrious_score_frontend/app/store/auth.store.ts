import { create } from "zustand";
import { AuthState, User } from "../types/auth.types";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  isAuthenticated: false,
  isLoading: true,

  setAuth: ({ user, accessToken }) => {
    set({
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setAccessToken: (token) => {
    set({
      accessToken: token,
    });
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  updateUser: (fields) => {
    set((state) => {
      if (!state.user) return state;

      return {
        user: {
          ...state.user,
          ...fields,
        },
      };
    });
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => {
    set({
      isLoading: loading,
    });
  },
}));
