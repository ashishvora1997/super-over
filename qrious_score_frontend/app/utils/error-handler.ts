import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string | string[];
  errors?: Record<string, string>;
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (!data) return "Something went wrong";

    if (typeof data.message === "string") {
      return data.message;
    }

    if (Array.isArray(data.message)) {
      return data.message[0];
    }

    if (data.errors && typeof data.errors === "object") {
      return Object.values(data.errors)[0];
    }
  }

  return "Something went wrong";
};
