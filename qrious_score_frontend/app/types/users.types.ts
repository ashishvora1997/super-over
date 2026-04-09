export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "scorer" | "viewer";
  createdAt?: string;
  updatedAt?: string;
}
