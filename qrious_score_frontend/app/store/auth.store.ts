import { create } from "zustand";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_profile_complete?: boolean;
  is_email_verified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;

  setAuth: (data: { user: User; token: string }) => void;
  loadUserFromStorage: () => void;
  updateUser: (fields: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isInitialized: false,

  setAuth: (data) => {
    document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    set({ user: data.user, token: data.token });
  },

  loadUserFromStorage: () => {
    const token =
      localStorage.getItem("token") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

    const userStr = localStorage.getItem("user");
    let parsedUser = null;
    if (userStr && userStr !== "undefined") {
      try {
        parsedUser = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user from storage:", e);
      }
    }

    set({
      token: token || null,
      user: parsedUser,
      isInitialized: true,
    });
  },

  updateUser: (fields) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...fields };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    });
  },

  logout: () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({ user: null, token: null });
  },
}));
