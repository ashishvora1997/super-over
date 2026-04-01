import { Column } from "@/app/types/table.types";

export function TableRow<T>({
  row,
  columns,
}: {
  row: T;
  columns: Column<T>[];
}) {
  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {columns.map((col) => {
        const value = (row as any)[col.key];
        return (
          <td
            key={col.key}
            className={`px-5 py-3.5 ${col.align === "right" ? "text-right" : ""}`}
          >
            {col.render ? (
              col.render(row)
            ) : value && value !== "" ? (
              value
            ) : (
              <span className="text-muted">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
