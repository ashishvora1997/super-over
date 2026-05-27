import { api } from "./api";
import { SuccessResponse } from "@/app/types/api.types";
import { ProfileData, UpsertProfilePayload } from "@/app/types/profile.types";

export const getMyProfile = async (): Promise<SuccessResponse<ProfileData>> => {
  const res = await api.get("/players/me");
  return res.data;
};

export const upsertProfile = async (
  data: UpsertProfilePayload,
): Promise<SuccessResponse<ProfileData>> => {
  const res = await api.put("/players/profile", data);
  return res.data;
};
