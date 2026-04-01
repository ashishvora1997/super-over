import { Column } from "@/app/types/table.types";

export function TableHeader<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <thead>
      <tr className="bg-gray-50/80 border-b border-border">
        {columns.map((col) => (
          <th
            key={col.key}
            className={`px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider ${
              col.className || ""
            } ${col.align === "right" ? "text-right" : "text-left"}`}
          >
            {col.title}
          </th>
        ))}
      </tr>
    </thead>
  );
}
