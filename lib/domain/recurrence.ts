import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  isAfter,
  parseISO,
  startOfMonth,
} from "date-fns";

export function recurrenceDates(
  start: string,
  desiredDay: number,
  count: number,
  end?: string,
): string[] {
  const dates: string[] = [];
  const startDate = parseISO(start);
  const endDate = end ? parseISO(end) : undefined;
  let month = startOfMonth(startDate);
  while (dates.length < count) {
    const candidate = new Date(month);
    candidate.setDate(Math.min(desiredDay, getDate(endOfMonth(month))));
    if (!isAfter(startDate, candidate)) {
      if (endDate && isAfter(candidate, endDate)) break;
      dates.push(format(candidate, "yyyy-MM-dd"));
    }
    month = addMonths(month, 1);
  }
  return dates;
}
