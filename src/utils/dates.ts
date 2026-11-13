export function dateKey(value: Date | string = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
export function shiftDate(days: number, from = dateKey()): string {
  const d = new Date(from + "T12:00:00");
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(value + "T12:00:00");
  return Number.isFinite(d.getTime()) && dateKey(d) === value;
}
