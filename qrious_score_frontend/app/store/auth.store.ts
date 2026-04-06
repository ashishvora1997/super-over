import { create } from "zustand";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;

  setAuth: (data: { user: User; token: string }) => void;
  loadUserFromStorage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,

  setAuth: (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    set({
      user: data.user,
      token: data.token,
      isInitialized: true,
    });
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

    set({
      user: null,
      token: null,
      isInitialized: true,
    });
  },
}));
