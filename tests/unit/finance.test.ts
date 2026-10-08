import { describe, expect, it } from "vitest";
import { calculateAccountBalance, invoiceTotals } from "@/lib/domain/accounts";
import {
  calculateSafeSpend,
  churchAllocation,
  summarizeBudget,
} from "@/lib/domain/budget";
import { createInstallments } from "@/lib/domain/installments";
import type { DomainTransaction } from "@/lib/domain/types";

const base = (partial: Partial<DomainTransaction>): DomainTransaction => ({
  id: crypto.randomUUID(),
  kind: "expense",
  status: "pending",
  amountCents: 1000,
  occurrenceDate: "2026-08-01",
  competenceMonth: "2026-08-01",
  ...partial,
});

describe("financial rules", () => {
  it("creates exact monthly installments", () => {
    const items = createInstallments(80003, 8, "2026-08-01");
    expect(items.map((item) => item.amountCents)).toEqual([
      10001, 10001, 10001, 10000, 10000, 10000, 10000, 10000,
    ]);
    expect(items.at(-1)?.invoiceMonth).toBe("2027-03-01");
  });

  it("summarizes planned, committed, paid and linked credits", () => {
    const transactions = [
      base({ status: "planned", categoryId: "food", amountCents: 2000 }),
      base({
        status: "pending",
        rootCategoryId: "food",
        categoryId: "market",
        amountCents: 6000,
      }),
      base({ status: "paid", categoryId: "food", amountCents: 3000 }),
      base({
        kind: "income",
        status: "paid",
        categoryId: "food",
        amountCents: 1000,
        reimbursementForId: "expense",
      }),
    ];
    const summary = summarizeBudget(
      [{ categoryId: "food", allocatedCents: 10000 }],
      transactions,
    )[0];
    expect(summary).toMatchObject({
      plannedCents: 2000,
      committedCents: 8000,
      paidCents: 2000,
      remainingCents: 2000,
      state: "attention",
    });
  });

  it("calculates safe spend and exposes deficit", () => {
    const transactions = [
      base({ kind: "income", status: "paid", amountCents: 100000 }),
      base({ status: "pending", amountCents: 60000 }),
      base({
        kind: "transfer",
        status: "paid",
        amountCents: 10000,
        destinationCountsAsReserve: true,
      }),
    ];
    expect(calculateSafeSpend(transactions)).toMatchObject({
      cashHeadroomCents: 30000,
      safeToSpendCents: 30000,
      deficitCents: 0,
    });
    expect(
      calculateSafeSpend([
        ...transactions,
        base({ status: "paid", amountCents: 40000 }),
      ]),
    ).toMatchObject({ safeToSpendCents: 0, deficitCents: 10000 });
  });

  it("does not double debit card purchases from account balance", () => {
    const transactions = [
      base({ status: "paid", accountId: "checking", amountCents: 5000 }),
      base({
        status: "paid",
        accountId: "checking",
        creditCardId: "card",
        amountCents: 4000,
      }),
      base({
        kind: "income",
        status: "paid",
        accountId: "checking",
        amountCents: 10000,
      }),
    ];
    expect(calculateAccountBalance("checking", 20000, transactions, 4000)).toBe(
      21000,
    );
  });

  it("reconciles invoice gross, credit, partial payment and open balance", () => {
    expect(invoiceTotals([10000, 5000], [2000], [3000])).toEqual({
      grossCents: 15000,
      creditsCents: 2000,
      netCents: 13000,
      paidCents: 3000,
      openCents: 10000,
    });
  });

  it("applies optional church rule while preserving explicit override", () => {
    expect(churchAllocation(1000000, true)).toBe(100000);
    expect(churchAllocation(1000000, false)).toBe(0);
    expect(churchAllocation(1000000, true, 75000)).toBe(75000);
  });
});
