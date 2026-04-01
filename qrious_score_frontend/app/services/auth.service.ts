import { api } from "./api";

export const loginUser = async (data: any) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const registerUser = async (data: any) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const res = await api.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (data: {
  token: string;
  password: string;
}) => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};
