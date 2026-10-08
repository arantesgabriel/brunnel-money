import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  parseISO,
  startOfMonth,
} from "date-fns";

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function monthStart(value: Date | string): string {
  return isoDate(
    startOfMonth(typeof value === "string" ? parseISO(value) : value),
  );
}

export function dateAtClampedDay(month: Date, desiredDay: number): Date {
  const lastDay = getDate(endOfMonth(month));
  const date = startOfMonth(month);
  date.setDate(Math.min(Math.max(desiredDay, 1), lastDay));
  return date;
}

export function addCalendarMonths(isoMonth: string, amount: number): string {
  return monthStart(addMonths(parseISO(isoMonth), amount));
}

export function competenceFor(
  method: "credit_card" | "direct",
  occurrenceDate: string,
  invoiceMonth?: string,
  override?: string,
): string {
  if (override) return monthStart(override);
  if (method === "credit_card") {
    if (!invoiceMonth)
      throw new Error("A competência do cartão exige a fatura.");
    return monthStart(invoiceMonth);
  }
  return monthStart(occurrenceDate);
}
