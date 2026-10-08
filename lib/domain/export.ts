export function safeCsvCell(value: string | number | boolean | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(
  rows: Array<Record<string, string | number | boolean | null>>,
): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(safeCsvCell).join(","),
    ...rows.map((row) => headers.map((key) => safeCsvCell(row[key])).join(",")),
  ].join("\r\n");
}
