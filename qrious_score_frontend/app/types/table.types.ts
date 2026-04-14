export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;

  page?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}
