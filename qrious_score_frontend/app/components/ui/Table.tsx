import { TableProps } from "@/app/types/table.types";
import { TableHeader } from "./table/table-header";
import { TableLoading } from "./table/table-loading";
import { TableEmpty } from "./table/table-empty";
import { TableRow } from "./table/table-row";
import { TablePagination } from "./table/table-pagination";

export function Table<T>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  page,
  total,
  pageSize,
  onPageChange,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHeader columns={columns} />
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <TableLoading columns={columns.length} />
            ) : data.length === 0 ? (
              <TableEmpty colSpan={columns.length} message={emptyMessage} />
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={i}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <TablePagination
          page={page ?? 1}
          total={total ?? 0}
          pageSize={pageSize || 10}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
