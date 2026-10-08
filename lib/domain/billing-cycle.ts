import { addMonths, isAfter, parseISO, startOfMonth } from "date-fns";
import { dateAtClampedDay, isoDate, monthStart } from "./dates";

export interface InvoiceDates {
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
}

export function invoiceDates(
  referenceMonth: string,
  closingDay: number,
  dueDay: number,
): InvoiceDates {
  if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
    throw new Error(
      "Dias de fechamento e vencimento devem ficar entre 1 e 31.",
    );
  }
  const reference = startOfMonth(parseISO(monthStart(referenceMonth)));
  const closingMonth =
    closingDay < dueDay ? reference : addMonths(reference, -1);
  return {
    referenceMonth: monthStart(reference),
    closingDate: isoDate(dateAtClampedDay(closingMonth, closingDay)),
    dueDate: isoDate(dateAtClampedDay(reference, dueDay)),
  };
}

export function invoiceForPurchase(
  purchaseDate: string,
  closingDay: number,
  dueDay: number,
): InvoiceDates {
  const purchase = parseISO(purchaseDate);
  let reference = startOfMonth(purchase);
  for (let index = 0; index < 15; index += 1) {
    const candidate = invoiceDates(isoDate(reference), closingDay, dueDay);
    if (!isAfter(purchase, parseISO(candidate.closingDate))) return candidate;
    reference = addMonths(reference, 1);
  }
  throw new Error("Não foi possível determinar a fatura.");
}
