import { Column } from "@/app/types/table.types";

export function TableRow<T>({
  row,
  columns,
  onRowClick,
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <tr
      className={`hover:bg-gray-50/70 transition-colors group ${
        onRowClick ? "cursor-pointer" : ""
      }`}
      onClick={(e) => {
        if (e.defaultPrevented) return;

        onRowClick?.(row);
      }}
    >
      {columns.map((col) => {
        const value = (row as Record<string, unknown>)[col.key as string];

        return (
          <td
            key={col.key}
            className={`px-5 py-3.5 ${
              col.align === "right" ? "text-right" : ""
            }`}
          >
            {col.render ? (
              col.render(row)
            ) : value && value !== "" ? (
              String(value)
            ) : (
              <span className="text-muted">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
