import { SuccessResponse } from '../types/response.type';

export const successResponse = <T>(
  message: string,
  data: T,
  meta?: SuccessResponse<T>['meta'],
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
  meta,
});
