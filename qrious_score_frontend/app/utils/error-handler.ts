export const getErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  if (!data) return "Something went wrong";

  // Case 1: simple message (login errors etc.)
  if (typeof data.message === "string") {
    return data.message;
  }

  // Case 2: validation errors object
  if (data.errors && typeof data.errors === "object") {
    return Object.values(data.errors)[0] as string;
  }

  return "Something went wrong";
};
