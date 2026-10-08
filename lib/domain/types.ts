export type TransactionKind = "income" | "expense" | "transfer";
export type TransactionStatus = "planned" | "pending" | "paid";
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "pix"
  | "cash"
  | "bank_transfer"
  | "other";

export interface DomainTransaction {
  id: string;
  kind: TransactionKind;
  status: TransactionStatus;
  amountCents: number;
  occurrenceDate: string;
  competenceMonth: string;
  categoryId?: string;
  rootCategoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  creditCardId?: string;
  invoiceId?: string;
  reimbursementForId?: string;
  reversalOfId?: string;
  destinationCountsAsReserve?: boolean;
  deleted?: boolean;
}

export interface BudgetLineInput {
  categoryId: string;
  allocatedCents: number;
}

export interface BudgetSummary {
  categoryId: string;
  allocatedCents: number;
  plannedCents: number;
  committedCents: number;
  paidCents: number;
  remainingCents: number;
  usedRatio: number;
  state: "normal" | "attention" | "critical";
}
