import { addMonths, endOfMonth, format, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AccountItem } from "@/components/finance/accounts-manager";
import type { CardItem } from "@/components/finance/cards-manager";
import type { TransactionItem } from "@/components/finance/transaction-list";
import { accounts, cards, transactions } from "@/lib/demo-data";
import {
  budgetRows,
  dashboard,
  demoCategories,
  projection,
  weeks,
} from "@/lib/demo-data";
import type { CategoryColor, CategoryItem } from "@/lib/domain/categories";
import { isoDate, monthStart } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";

const isDemo = () =>
  process.env.BRUNNEL_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

async function householdContext() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", auth.user.id)
    .maybeSingle();
  const { data: membership } = await supabase
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return membership
    ? {
        supabase,
        householdId: membership.household_id,
        userName:
          profile?.display_name ??
          (auth.user.user_metadata.display_name as string | undefined),
      }
    : null;
}

function moneyToCents(value: number | string | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}

function selectedMonth(value?: string | null): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return monthStart(value);
  }
  return monthStart(new Date());
}

export function monthParam(value?: string | null): string {
  return selectedMonth(value).slice(0, 7);
}

export function monthLabel(value?: string | null): string {
  return format(
    parse(selectedMonth(value), "yyyy-MM-dd", new Date()),
    "MMM yyyy",
    {
      locale: ptBR,
    },
  )
    .replace(".", "")
    .toUpperCase();
}

function monthRange(month?: string | null) {
  const start = selectedMonth(month);
  const date = parseISO(start);
  return {
    start,
    end: isoDate(endOfMonth(date)),
  };
}

export interface BudgetRowItem {
  id: string;
  categoryId: string | null;
  name: string;
  allocated: number;
  committed: number;
  paid: number;
  state: "normal" | "attention" | "critical";
}

export interface DashboardData {
  safeToSpendCents: number;
  incomeCents: number;
  committedCents: number;
  paidCents: number;
  budgetRemainingCents: number;
  invoice: {
    title: string;
    amountCents: number;
    due: string;
    goalCents: number;
    status: string;
  };
  savings: {
    name: string;
    currentCents: number;
    targetCents: number;
  };
}

export interface MarketWeekItem {
  label: string;
  allocated: number;
  spent: number;
}

export interface ProjectionItem {
  month: string;
  income: number;
  recurring: number;
  invoices: number;
  extras: number;
  savings: number;
  balance: number;
}

export interface InvoiceItem {
  id: string;
  title: string;
  subtitle: string;
  amountCents: number;
}

export interface SavingsGoalItem {
  id: string;
  name: string;
  currentCents: number;
  targetCents: number;
  targetDate: string | null;
}

export interface TrashTransactionItem extends TransactionItem {
  deletedAt: string;
  recoverableUntil: string;
}

export async function listTransactions(
  month?: string | null,
): Promise<TransactionItem[]> {
  if (isDemo()) return transactions;
  const context = await householdContext();
  if (!context) return [];
  const range = monthRange(month);
  const [{ data: rows }, { data: categories }] = await Promise.all([
    context.supabase
      .from("transactions")
      .select(
        "id,kind,status,description,amount,occurrence_date,category_id,payment_method,updated_at",
      )
      .eq("household_id", context.householdId)
      .eq("competence_month", range.start)
      .is("deleted_at", null)
      .order("occurrence_date", { ascending: false })
      .limit(500),
    context.supabase
      .from("categories")
      .select("id,name")
      .eq("household_id", context.householdId),
  ]);
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  return (rows ?? []).map((row) => {
    const positive = row.kind === "income";
    const paymentLabels: Record<string, string> = {
      credit_card: "Cartão de crédito",
      debit_card: "Débito",
      pix: "Pix",
      cash: "Dinheiro",
      bank_transfer: "Transferência",
      other: "Outro",
    };
    return {
      id: row.id,
      date: format(parseISO(row.occurrence_date), "dd MMM", {
        locale: ptBR,
      }).toUpperCase(),
      occurrenceDate: row.occurrence_date,
      description: row.description,
      category:
        row.kind === "transfer"
          ? "Transferência"
          : (categoryNames.get(row.category_id ?? "") ?? "Sem categoria"),
      method: paymentLabels[row.payment_method] ?? "Outro",
      responsible: context.userName ?? "Família",
      amountCents: moneyToCents(row.amount) * (positive ? 1 : -1),
      status: row.status,
      updatedAt: row.updated_at,
    };
  });
}

export async function listAccounts(): Promise<AccountItem[]> {
  if (isDemo()) return accounts;
  const context = await householdContext();
  if (!context) return [];
  const [{ data }, { data: movements }, { data: adjustments }] =
    await Promise.all([
      context.supabase
        .from("accounts")
        .select(
          "id,name,type,institution,opening_balance,counts_as_reserve,updated_at",
        )
        .eq("household_id", context.householdId)
        .is("archived_at", null)
        .order("name"),
      context.supabase
        .from("transactions")
        .select("kind,status,amount,account_id,destination_account_id")
        .eq("household_id", context.householdId)
        .eq("status", "paid")
        .is("deleted_at", null),
      context.supabase
        .from("account_adjustments")
        .select("account_id,amount")
        .eq("household_id", context.householdId),
    ]);
  const balanceByAccount = new Map<string, number>();
  for (const movement of movements ?? []) {
    const cents = moneyToCents(movement.amount);
    if (movement.kind === "income" && movement.account_id) {
      balanceByAccount.set(
        movement.account_id,
        (balanceByAccount.get(movement.account_id) ?? 0) + cents,
      );
    }
    if (movement.kind === "expense" && movement.account_id) {
      balanceByAccount.set(
        movement.account_id,
        (balanceByAccount.get(movement.account_id) ?? 0) - cents,
      );
    }
    if (movement.kind === "transfer") {
      if (movement.account_id) {
        balanceByAccount.set(
          movement.account_id,
          (balanceByAccount.get(movement.account_id) ?? 0) - cents,
        );
      }
      if (movement.destination_account_id) {
        balanceByAccount.set(
          movement.destination_account_id,
          (balanceByAccount.get(movement.destination_account_id) ?? 0) + cents,
        );
      }
    }
  }
  for (const adjustment of adjustments ?? []) {
    balanceByAccount.set(
      adjustment.account_id,
      (balanceByAccount.get(adjustment.account_id) ?? 0) +
        moneyToCents(adjustment.amount),
    );
  }
  return (data ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    institution: account.institution ?? "",
    balanceCents:
      moneyToCents(account.opening_balance) +
      (balanceByAccount.get(account.id) ?? 0),
    updated: format(parseISO(account.updated_at), "dd/MM/yyyy HH:mm"),
    countsAsReserve: account.counts_as_reserve,
  }));
}

export async function listCards(): Promise<CardItem[]> {
  if (isDemo()) return cards;
  const context = await householdContext();
  if (!context) return [];
  const { data } = await context.supabase
    .from("credit_cards")
    .select(
      "id,name,institution,network,last_four,closing_day,due_day,bank_limit,monthly_goal",
    )
    .eq("household_id", context.householdId)
    .is("archived_at", null)
    .order("name");
  return (data ?? [])
    .filter(
      (
        card,
      ): card is typeof card & {
        network: "visa" | "mastercard";
        last_four: string;
      } => card.network !== null && card.last_four !== null,
    )
    .map((card) => ({
      id: card.id,
      name: card.name,
      institution: card.institution ?? "",
      network: card.network,
      lastFour: card.last_four,
      holder: context.userName ?? "Titular",
      closingDay: card.closing_day,
      dueDay: card.due_day,
      bankLimitCents: moneyToCents(card.bank_limit),
      monthlyGoalCents: moneyToCents(card.monthly_goal),
    }));
}

export async function listCategories(): Promise<CategoryItem[]> {
  if (isDemo()) return demoCategories;
  const context = await householdContext();
  if (!context) return [];
  const { data } = await context.supabase
    .from("categories")
    .select("id,name,type,color,is_system,archived_at,position")
    .eq("household_id", context.householdId)
    .is("archived_at", null)
    .order("position")
    .order("name");
  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    color: (category.color ?? "teal") as CategoryColor,
    isSystem: category.is_system,
    archived: category.archived_at !== null,
  }));
}

export async function listBudgetRows(
  month?: string | null,
): Promise<BudgetRowItem[]> {
  if (isDemo()) {
    return budgetRows.map((row) => ({
      ...row,
      id: row.name,
      categoryId: null,
    }));
  }
  const context = await householdContext();
  if (!context) return [];
  const selected = selectedMonth(month);
  const [{ data: budget }, transactionsForMonth] = await Promise.all([
    context.supabase
      .from("monthly_budgets")
      .select("id")
      .eq("household_id", context.householdId)
      .eq("month", selected)
      .maybeSingle(),
    listTransactions(selected),
  ]);
  const { data: categories } = await context.supabase
    .from("categories")
    .select("id,name,type,position")
    .eq("household_id", context.householdId)
    .in("type", ["expense", "both"])
    .is("archived_at", null)
    .order("position")
    .order("name");
  const committedByCategory = new Map<
    string,
    { committed: number; paid: number }
  >();
  for (const item of transactionsForMonth) {
    if (item.amountCents >= 0 || item.category === "Transferência") continue;
    const current = committedByCategory.get(item.category) ?? {
      committed: 0,
      paid: 0,
    };
    current.committed += Math.abs(item.amountCents);
    if (item.status === "paid") current.paid += Math.abs(item.amountCents);
    committedByCategory.set(item.category, current);
  }
  let allocations = new Map<string, { id: string; allocated: number }>();
  if (budget?.id) {
    const { data: lines } = await context.supabase
      .from("budget_lines")
      .select("id,category_id,allocated")
      .eq("household_id", context.householdId)
      .eq("budget_id", budget.id);
    allocations = new Map(
      (lines ?? []).map((line) => [
        line.category_id,
        { id: line.id, allocated: moneyToCents(line.allocated) },
      ]),
    );
  }
  return (categories ?? [])
    .map((category) => {
      const allocation = allocations.get(category.id);
      const totals = committedByCategory.get(category.name) ?? {
        committed: 0,
        paid: 0,
      };
      const allocated = allocation?.allocated ?? totals.committed;
      const ratio = allocated > 0 ? totals.committed / allocated : 0;
      return {
        id: allocation?.id ?? category.id,
        categoryId: category.id,
        name: category.name,
        allocated,
        committed: totals.committed,
        paid: totals.paid,
        state: ratio >= 1 ? "critical" : ratio >= 0.8 ? "attention" : "normal",
      } satisfies BudgetRowItem;
    })
    .filter((row) => row.allocated > 0 || row.committed > 0);
}

export async function getDashboardData(
  month?: string | null,
): Promise<DashboardData> {
  if (isDemo())
    return {
      ...dashboard,
      invoice: { ...dashboard.invoice, title: "Fatura Santander" },
    };
  const context = await householdContext();
  if (!context) {
    return {
      safeToSpendCents: 0,
      incomeCents: 0,
      committedCents: 0,
      paidCents: 0,
      budgetRemainingCents: 0,
      invoice: {
        title: "Nenhuma fatura",
        amountCents: 0,
        due: "sem vencimento",
        goalCents: 0,
        status: "Sem cartão",
      },
      savings: {
        name: "Reserva",
        currentCents: 0,
        targetCents: 1,
      },
    };
  }
  const selected = selectedMonth(month);
  const [items, rows, invoice, goal] = await Promise.all([
    listTransactions(selected),
    listBudgetRows(selected),
    getPrimaryInvoice(selected),
    getPrimarySavingsGoal(),
  ]);
  const incomeCents = items
    .filter((item) => item.amountCents > 0)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const committedCents = items
    .filter((item) => item.amountCents < 0)
    .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
  const paidCents = items
    .filter((item) => item.amountCents < 0 && item.status === "paid")
    .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
  const allocatedCents = rows.reduce((sum, row) => sum + row.allocated, 0);
  const budgetRemainingCents = Math.max(0, allocatedCents - committedCents);
  const safeToSpendCents =
    allocatedCents > 0
      ? budgetRemainingCents
      : Math.max(0, incomeCents - committedCents);
  return {
    safeToSpendCents,
    incomeCents,
    committedCents,
    paidCents,
    budgetRemainingCents,
    invoice,
    savings: goal,
  };
}

async function getPrimaryInvoice(
  month: string,
): Promise<DashboardData["invoice"]> {
  const context = await householdContext();
  if (!context) {
    return {
      title: "Nenhuma fatura",
      amountCents: 0,
      due: "sem vencimento",
      goalCents: 0,
      status: "Sem cartão",
    };
  }
  const { data: invoices } = await context.supabase
    .from("credit_card_invoices")
    .select("id,reference_month,due_date,status,credit_card_id")
    .eq("household_id", context.householdId)
    .eq("reference_month", month)
    .order("due_date")
    .limit(1);
  const invoice = invoices?.[0];
  if (!invoice) {
    return {
      title: "Nenhuma fatura",
      amountCents: 0,
      due: "sem vencimento",
      goalCents: 0,
      status: "Sem fatura",
    };
  }
  const [{ data: card }, { data: charges }] = await Promise.all([
    context.supabase
      .from("credit_cards")
      .select("name,monthly_goal")
      .eq("id", invoice.credit_card_id)
      .maybeSingle(),
    context.supabase
      .from("transactions")
      .select("amount")
      .eq("household_id", context.householdId)
      .eq("invoice_id", invoice.id)
      .is("deleted_at", null),
  ]);
  const amountCents = (charges ?? []).reduce(
    (sum, charge) => sum + moneyToCents(charge.amount),
    0,
  );
  return {
    title: card?.name ? `Fatura ${card.name}` : "Fatura",
    amountCents,
    due: format(parseISO(invoice.due_date), "dd/MM"),
    goalCents: moneyToCents(card?.monthly_goal) || Math.max(amountCents, 1),
    status: invoice.status === "paid" ? "Paga" : "Aberta",
  };
}

async function getPrimarySavingsGoal(): Promise<DashboardData["savings"]> {
  const context = await householdContext();
  if (!context) return { name: "Reserva", currentCents: 0, targetCents: 1 };
  const { data: goal } = await context.supabase
    .from("savings_goals")
    .select("name,target_amount,account_id")
    .eq("household_id", context.householdId)
    .eq("active", true)
    .is("deleted_at", null)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!goal) return { name: "Reserva", currentCents: 0, targetCents: 1 };
  const accounts = await listAccounts();
  const account = accounts.find((item) => item.id === goal.account_id);
  return {
    name: goal.name,
    currentCents: account?.balanceCents ?? 0,
    targetCents: Math.max(moneyToCents(goal.target_amount), 1),
  };
}

export async function listMarketWeeks(
  month?: string | null,
): Promise<MarketWeekItem[]> {
  if (isDemo()) return weeks;
  const context = await householdContext();
  if (!context) return [];
  const selected = selectedMonth(month);
  const [{ data: planned }, items] = await Promise.all([
    context.supabase
      .from("weekly_food_budgets")
      .select("starts_on,ends_on,allocated")
      .eq("household_id", context.householdId)
      .eq("month", selected)
      .order("starts_on"),
    listTransactions(selected),
  ]);
  const rows = (planned ?? []).map((week) => {
    const start = parseISO(week.starts_on);
    const end = parseISO(week.ends_on);
    const spent = items
      .filter(
        (item) =>
          item.category === "Alimentação" &&
          item.amountCents < 0 &&
          item.occurrenceDate >= week.starts_on &&
          item.occurrenceDate <= week.ends_on,
      )
      .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
    return {
      label:
        start.getMonth() === end.getMonth()
          ? `${format(start, "d", { locale: ptBR })}-${format(end, "d MMM", { locale: ptBR })}`
          : `${format(start, "d MMM", { locale: ptBR })}-${format(end, "d MMM", { locale: ptBR })}`,
      allocated: moneyToCents(week.allocated),
      spent,
    };
  });
  if (rows.length > 0) return rows;
  const food = items
    .filter((item) => item.category === "Alimentação" && item.amountCents < 0)
    .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
  return food > 0
    ? [{ label: monthLabel(selected), allocated: food, spent: food }]
    : [];
}

export async function listProjection(
  month?: string | null,
): Promise<ProjectionItem[]> {
  if (isDemo()) return projection;
  const context = await householdContext();
  if (!context) return [];
  const first = parseISO(selectedMonth(month));
  const rows: ProjectionItem[] = [];
  for (let index = 0; index < 6; index += 1) {
    const current = monthStart(addMonths(first, index));
    const [items, invoice] = await Promise.all([
      listTransactions(current),
      getPrimaryInvoice(current),
    ]);
    const income = items
      .filter((item) => item.amountCents > 0)
      .reduce((sum, item) => sum + item.amountCents, 0);
    const expenses = items
      .filter(
        (item) => item.amountCents < 0 && item.method !== "Cartão de crédito",
      )
      .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
    const savings = items
      .filter((item) => item.category === "Transferência")
      .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
    rows.push({
      month: format(parseISO(current), "MMM", { locale: ptBR }).replace(
        ".",
        "",
      ),
      income,
      recurring: expenses,
      invoices: invoice.amountCents,
      extras: 0,
      savings,
      balance: income - expenses - invoice.amountCents - savings,
    });
  }
  return rows;
}

export async function listInvoices(
  month?: string | null,
): Promise<InvoiceItem[]> {
  if (isDemo()) {
    return [
      {
        id: "demo-current",
        title: "Agosto de 2026",
        subtitle: "Vence 12/08 · aberta",
        amountCents: dashboard.invoice.amountCents,
      },
      {
        id: "demo-previous",
        title: "Julho de 2026",
        subtitle: "Pago em 11/07",
        amountCents: 154300,
      },
    ];
  }
  const context = await householdContext();
  if (!context) return [];
  const selected = selectedMonth(month);
  const { data } = await context.supabase
    .from("credit_card_invoices")
    .select("id,reference_month,due_date,status,paid_at")
    .eq("household_id", context.householdId)
    .gte("reference_month", monthStart(addMonths(parseISO(selected), -1)))
    .lte("reference_month", monthStart(addMonths(parseISO(selected), 1)))
    .order("reference_month", { ascending: false });
  return Promise.all(
    (data ?? []).map(async (invoice) => {
      const { data: charges } = await context.supabase
        .from("transactions")
        .select("amount")
        .eq("household_id", context.householdId)
        .eq("invoice_id", invoice.id)
        .is("deleted_at", null);
      const amountCents = (charges ?? []).reduce(
        (sum, charge) => sum + moneyToCents(charge.amount),
        0,
      );
      const title = format(
        parseISO(invoice.reference_month),
        "MMMM 'de' yyyy",
        {
          locale: ptBR,
        },
      );
      const subtitle =
        invoice.status === "paid" && invoice.paid_at
          ? `Pago em ${format(parseISO(invoice.paid_at), "dd/MM")}`
          : `Vence ${format(parseISO(invoice.due_date), "dd/MM")} · ${invoice.status === "open" ? "aberta" : "fechada"}`;
      return { id: invoice.id, title, subtitle, amountCents };
    }),
  );
}

export async function listSavingsGoals(): Promise<SavingsGoalItem[]> {
  if (isDemo()) {
    return [
      {
        id: "demo-reserve",
        name: dashboard.savings.name,
        currentCents: dashboard.savings.currentCents,
        targetCents: dashboard.savings.targetCents,
        targetDate: "2027-06-30",
      },
    ];
  }
  const context = await householdContext();
  if (!context) return [];
  const [{ data: goals }, accountItems] = await Promise.all([
    context.supabase
      .from("savings_goals")
      .select("id,name,target_amount,target_date,account_id")
      .eq("household_id", context.householdId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("priority", { ascending: false })
      .order("name"),
    listAccounts(),
  ]);
  const accountsById = new Map(
    accountItems.map((account) => [account.id, account]),
  );
  return (goals ?? []).map((goal) => ({
    id: goal.id,
    name: goal.name,
    currentCents: accountsById.get(goal.account_id)?.balanceCents ?? 0,
    targetCents: moneyToCents(goal.target_amount),
    targetDate: goal.target_date,
  }));
}

export async function listDeletedTransactions(): Promise<
  TrashTransactionItem[]
> {
  if (isDemo()) return [];
  const context = await householdContext();
  if (!context) return [];
  const { data: rows } = await context.supabase
    .from("transactions")
    .select(
      "id,kind,status,description,amount,occurrence_date,category_id,payment_method,updated_at,deleted_at",
    )
    .eq("household_id", context.householdId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(100);
  const { data: categories } = await context.supabase
    .from("categories")
    .select("id,name")
    .eq("household_id", context.householdId);
  const categoryNames = new Map(
    (categories ?? []).map((category) => [category.id, category.name]),
  );
  return (rows ?? []).map((row) => {
    const deletedAt = row.deleted_at ?? new Date().toISOString();
    const recoverableUntil = addMonths(parseISO(deletedAt), 1).toISOString();
    return {
      id: row.id,
      date: format(parseISO(row.occurrence_date), "dd MMM", {
        locale: ptBR,
      }).toUpperCase(),
      occurrenceDate: row.occurrence_date,
      description: row.description,
      category:
        row.kind === "transfer"
          ? "Transferência"
          : (categoryNames.get(row.category_id ?? "") ?? "Sem categoria"),
      method: row.payment_method,
      responsible: context.userName ?? "Família",
      amountCents: moneyToCents(row.amount) * (row.kind === "income" ? 1 : -1),
      status: row.status,
      updatedAt: row.updated_at,
      deletedAt,
      recoverableUntil,
    };
  });
}
