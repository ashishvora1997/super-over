import { api } from "./api";
import { SuccessResponse } from "@/app/types/api.types";
import { User } from "@/app/types/users.types";

export const getUsers = async (params?: {
  page?: number;
  limit?: number;
}): Promise<SuccessResponse<User[]>> => {
  const res = await api.get("/users", { params });
  return res.data;
};

export const updateUserRole = async (
  id: number,
  role: "viewer" | "scorer",
): Promise<SuccessResponse<User>> => {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data;
};
