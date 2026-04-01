export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    [key: string]: unknown;
  };
}
