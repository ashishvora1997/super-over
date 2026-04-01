import { create } from "zustand";
import { AuthState } from "../types/auth.types";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,

  setAuth: (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    set({ user: data.user, token: data.token });
  },

  loadUserFromStorage: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    set({
      token: token || null,
      user: user ? JSON.parse(user) : null,
      isInitialized: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({ user: null, token: null });
  },
}));
