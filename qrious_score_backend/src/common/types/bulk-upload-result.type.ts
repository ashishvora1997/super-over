export type BulkUploadResult = {
  success_count: number;
  failed_count: number;
  errors: { row: number; error: string }[];
};
