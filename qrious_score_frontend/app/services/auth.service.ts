import { api } from "./api";

import {
  AuthResponse,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SuccessResponse,
} from "@/app/types/api.types";

export const loginUser = async (
  data: LoginDto,
): Promise<SuccessResponse<AuthResponse>> => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const registerUser = async (
  data: RegisterDto,
): Promise<
  SuccessResponse<{
    userId: number;
    email: string;
  }>
> => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const forgotPassword = async (
  data: ForgotPasswordDto,
): Promise<SuccessResponse<null>> => {
  const res = await api.post("/auth/forgot-password", data);
  return res.data;
};

export const resetPassword = async (
  data: ResetPasswordDto,
): Promise<SuccessResponse<null>> => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};

export const verifyEmail = async (data: {
  userId: number;
  otp: string;
}): Promise<SuccessResponse<AuthResponse>> => {
  const res = await api.post("/auth/verify-email", data);
  return res.data;
};

export const resendOTP = async (data: {
  userId: number;
}): Promise<
  SuccessResponse<{
    expiresIn: number;
    remainingAttempts: number;
  }>
> => {
  const res = await api.post("/auth/resend-otp", data);
  return res.data;
};

export const logoutUser = async (): Promise<SuccessResponse<null>> => {
  const res = await api.post("/auth/logout");
  return res.data;
};

export const logoutAllDevices = async (): Promise<SuccessResponse<null>> => {
  const res = await api.post("/auth/logout-all-devices");
  return res.data;
};

export const refreshAccessToken = async (): Promise<
  SuccessResponse<{
    accessToken: string;
  }>
> => {
  const res = await api.post("/auth/refresh");
  return res.data;
};
