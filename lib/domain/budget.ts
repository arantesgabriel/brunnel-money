import type {
  BudgetLineInput,
  BudgetSummary,
  DomainTransaction,
} from "./types";

const active = (transaction: DomainTransaction) => !transaction.deleted;
const committed = (transaction: DomainTransaction) =>
  transaction.status !== "planned";
const isCredit = (transaction: DomainTransaction) =>
  Boolean(transaction.reimbursementForId || transaction.reversalOfId);

export function summarizeBudget(
  lines: BudgetLineInput[],
  transactions: DomainTransaction[],
): BudgetSummary[] {
  return lines.map((line) => {
    const relevant = transactions.filter(
      (item) =>
        active(item) &&
        item.kind !== "transfer" &&
        (item.rootCategoryId ?? item.categoryId) === line.categoryId,
    );
    const signed = (item: DomainTransaction) =>
      isCredit(item) ? -item.amountCents : item.amountCents;
    const plannedCents = relevant
      .filter((item) => item.status === "planned")
      .reduce((sum, item) => sum + signed(item), 0);
    const committedCents = relevant
      .filter(committed)
      .reduce((sum, item) => sum + signed(item), 0);
    const paidCents = relevant
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + signed(item), 0);
    const usedRatio =
      line.allocatedCents === 0
        ? committedCents > 0
          ? 1
          : 0
        : committedCents / line.allocatedCents;
    return {
      ...line,
      plannedCents,
      committedCents,
      paidCents,
      remainingCents: line.allocatedCents - committedCents,
      usedRatio,
      state:
        usedRatio >= 1 ? "critical" : usedRatio >= 0.8 ? "attention" : "normal",
    };
  });
}

export function churchAllocation(
  salaryIncomeCents: number,
  enabled: boolean,
  manualOverrideCents?: number,
): number {
  if (manualOverrideCents !== undefined) return manualOverrideCents;
  return enabled ? Math.round(salaryIncomeCents * 0.1) : 0;
}

export interface SafeSpendResult {
  incomeCommittedCents: number;
  outflowCommittedCents: number;
  cashHeadroomCents: number;
  budgetRemainingCents?: number;
  safeToSpendCents: number;
  deficitCents: number;
}

export function calculateSafeSpend(
  transactions: DomainTransaction[],
  budget?: BudgetSummary[],
): SafeSpendResult {
  const considered = transactions.filter(
    (item) => active(item) && committed(item),
  );
  const credits = considered
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const expenses = considered
    .filter((item) => item.kind === "expense")
    .reduce(
      (sum, item) =>
        sum + (isCredit(item) ? -item.amountCents : item.amountCents),
      0,
    );
  const reserves = considered
    .filter(
      (item) => item.kind === "transfer" && item.destinationCountsAsReserve,
    )
    .reduce((sum, item) => sum + item.amountCents, 0);
  const cashHeadroomCents = credits - expenses - reserves;
  const budgetRemainingCents = budget?.reduce(
    (sum, line) => sum + line.remainingCents,
    0,
  );
  return {
    incomeCommittedCents: credits,
    outflowCommittedCents: expenses + reserves,
    cashHeadroomCents,
    budgetRemainingCents,
    safeToSpendCents: Math.max(
      0,
      budgetRemainingCents === undefined
        ? cashHeadroomCents
        : Math.min(cashHeadroomCents, budgetRemainingCents),
    ),
    deficitCents: Math.max(0, -cashHeadroomCents),
  };
}
