export interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    is_email_verified: boolean;
    is_profile_complete: boolean;
  };
  accessToken: string;
}
