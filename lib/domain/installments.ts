import { addCalendarMonths } from "./dates";
import { splitCents } from "./money";

export interface Installment {
  number: number;
  count: number;
  amountCents: number;
  invoiceMonth: string;
}

export function createInstallments(
  totalCents: number,
  count: number,
  firstInvoiceMonth: string,
): Installment[] {
  return splitCents(totalCents, count).map((amountCents, index) => ({
    number: index + 1,
    count,
    amountCents,
    invoiceMonth: addCalendarMonths(firstInvoiceMonth, index),
  }));
}
