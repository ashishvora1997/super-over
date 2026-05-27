export interface User {
  id: number;
  name: string;
  email: string;
  is_profile_complete?: boolean;
  is_email_verified?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (data: { user: User; accessToken: string | null }) => void;

  setAccessToken: (token: string | null) => void;

  setUser: (user: User | null) => void;

  updateUser: (fields: Partial<User>) => void;

  clearAuth: () => void;

  setLoading: (loading: boolean) => void;
}
