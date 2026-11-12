/** UTC day boundaries are shared by writes, reads and the dashboard. Existing key format is preserved. */
export function getDate(sub = 0, now = new Date()): string {
  const day = new Date(now);
  day.setUTCDate(day.getUTCDate() - sub);
  return `${String(day.getUTCDate()).padStart(2, "0")}/${String(day.getUTCMonth() + 1).padStart(2, "0")}/${day.getUTCFullYear()}`;
}
