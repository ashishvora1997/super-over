export interface JwtPayload {
  sub?: number;
  id?: number;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}
