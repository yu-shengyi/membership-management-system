import type { Transaction } from "../types/index.ts";
import { dateKey, shiftDate } from "./dates.ts";
export function transactionTrend(
  rows: Transaction[],
  start: string,
  end: string,
  granularity: "day" | "week" | "month",
) {
  const groups = new Map<
    string,
    { date: string; recharge: number; consume: number; refund: number }
  >();
  const bucket = (day: string) => {
    if (granularity === "month") return day.slice(0, 7);
    if (granularity === "week") {
      const d = new Date(day + "T12:00:00");
      return shiftDate(-((d.getDay() + 6) % 7), day);
    }
    return day;
  };
  for (let day = start; day <= end; day = shiftDate(1, day)) {
    const k = bucket(day);
    if (!groups.has(k))
      groups.set(k, { date: k, recharge: 0, consume: 0, refund: 0 });
  }
  for (const t of rows) {
    const day = dateKey(t.createdAt);
    if (day < start || day > end) continue;
    const group = groups.get(bucket(day));
    if (group) group[t.type] += Math.round(t.amount * 100);
  }
  return [...groups.values()].map((g) => ({
    ...g,
    recharge: g.recharge / 100,
    consume: g.consume / 100,
    refund: g.refund / 100,
  }));
}
