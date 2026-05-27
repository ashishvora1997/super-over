import { api } from "./api";
import { SuccessResponse } from "@/app/types/api.types";
import { User } from "../types/auth.types";

export const getCurrentUser = async (): Promise<
  SuccessResponse<{
    user: User;
  }>
> => {
  const res = await api.get("/users/me");
  return res.data;
};
