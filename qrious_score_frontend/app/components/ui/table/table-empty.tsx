export function TableEmpty({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-6 text-center text-muted">
        {message}
      </td>
    </tr>
  );
}
