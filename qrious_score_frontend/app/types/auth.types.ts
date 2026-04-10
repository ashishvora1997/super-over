export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isInitialized: boolean;

  setAuth: (data: { user: User; token: string }) => void;
  loadUserFromStorage: () => void;
  logout: () => void;
}
