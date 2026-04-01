export interface AuthState {
  user: any;
  token: string | null;
  isInitialized: boolean;
  setAuth: (data: any) => void;
  loadUserFromStorage: () => void;
  logout: () => void;
}
