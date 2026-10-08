import type { DomainTransaction } from "./types";

export function calculateAccountBalance(
  accountId: string,
  openingBalanceCents: number,
  transactions: DomainTransaction[],
  invoicePaymentsCents: number,
  adjustmentsCents = 0,
): number {
  return transactions
    .filter(
      (item) => !item.deleted && item.status === "paid" && !item.creditCardId,
    )
    .reduce(
      (balance, item) => {
        if (item.kind === "income" && item.accountId === accountId)
          return balance + item.amountCents;
        if (item.kind === "expense" && item.accountId === accountId)
          return balance - item.amountCents;
        if (item.kind === "transfer" && item.accountId === accountId)
          return balance - item.amountCents;
        if (item.kind === "transfer" && item.destinationAccountId === accountId)
          return balance + item.amountCents;
        return balance;
      },
      openingBalanceCents + adjustmentsCents - invoicePaymentsCents,
    );
}

export function invoiceTotals(
  expensesCents: number[],
  reversalCents: number[],
  paymentsCents: number[],
) {
  const grossCents = expensesCents.reduce((sum, value) => sum + value, 0);
  const creditsCents = reversalCents.reduce((sum, value) => sum + value, 0);
  const netCents = grossCents - creditsCents;
  const paidCents = paymentsCents.reduce((sum, value) => sum + value, 0);
  return {
    grossCents,
    creditsCents,
    netCents,
    paidCents,
    openCents: Math.max(0, netCents - paidCents),
  };
}
