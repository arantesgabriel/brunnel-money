import {
  addDays,
  endOfMonth,
  format,
  getDay,
  isAfter,
  parseISO,
  startOfMonth,
} from "date-fns";

export interface MarketWeek {
  startDate: string;
  endDate: string;
  allocatedCents: number;
  spentCents: number;
  remainingCents: number;
  ratio: number;
  state: "normal" | "attention" | "hold" | "over";
}

export function createMonthWeeks(
  month: string,
  totalCents: number,
  spentByDate: Record<string, number> = {},
): MarketWeek[] {
  const first = startOfMonth(parseISO(month));
  const last = endOfMonth(first);
  const weeks: Array<{ start: Date; end: Date }> = [];
  let cursor = first;
  while (!isAfter(cursor, last)) {
    const daysUntilSunday = (7 - getDay(cursor)) % 7;
    const candidateEnd = addDays(cursor, daysUntilSunday);
    const end = isAfter(candidateEnd, last) ? last : candidateEnd;
    weeks.push({ start: cursor, end });
    cursor = addDays(end, 1);
  }
  const base = Math.floor(totalCents / weeks.length);
  const remainder = totalCents % weeks.length;
  return weeks.map((week, index) => {
    let spentCents = 0;
    for (let day = week.start; !isAfter(day, week.end); day = addDays(day, 1)) {
      spentCents += spentByDate[format(day, "yyyy-MM-dd")] ?? 0;
    }
    const allocatedCents = base + (index < remainder ? 1 : 0);
    const ratio =
      allocatedCents === 0
        ? spentCents > 0
          ? 1
          : 0
        : spentCents / allocatedCents;
    return {
      startDate: format(week.start, "yyyy-MM-dd"),
      endDate: format(week.end, "yyyy-MM-dd"),
      allocatedCents,
      spentCents,
      remainingCents: allocatedCents - spentCents,
      ratio,
      state:
        ratio > 1
          ? "over"
          : ratio >= 0.9
            ? "hold"
            : ratio >= 0.7
              ? "attention"
              : "normal",
    };
  });
}
