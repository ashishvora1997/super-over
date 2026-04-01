export function TableLoading({ columns }: { columns: number }) {
  return (
    <tr>
      <td colSpan={columns} className="px-5 py-6 text-center text-muted">
        Loading...
      </td>
    </tr>
  );
}
