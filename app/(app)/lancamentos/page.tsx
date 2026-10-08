import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import { MonthSwitcher } from "@/components/finance/month-switcher";
import { TransactionList } from "@/components/finance/transaction-list";
import { MoneyDisplay } from "@/components/ui/money-display";
import {
  listTransactions,
  monthLabel,
  monthParam,
} from "@/lib/queries/finance";

export const metadata = { title: "Lançamentos" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const transactionItems = await listTransactions(month);
  const incomeCents = transactionItems
    .filter((item) => item.amountCents > 0)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const outflowCents = transactionItems
    .filter((item) => item.amountCents < 0)
    .reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
  const balanceCents = incomeCents - outflowCents;
  const pendingCount = transactionItems.filter(
    (item) => item.status === "pending",
  ).length;

  return (
    <div className="page transactions-page">
      <header className="resource-page-header">
        <div>
          <h1>Lançamentos</h1>
          <p>Movimentos da família em um só lugar.</p>
        </div>
        <MonthSwitcher month={month} label={monthLabel(month)} />
      </header>

      <section className="transactions-overview" aria-labelledby="flow-title">
        <div className="flow-balance">
          <span className="flow-icon" aria-hidden="true">
            <CircleDollarSign size={21} />
          </span>
          <div>
            <span id="flow-title">Saldo do período</span>
            <MoneyDisplay cents={balanceCents} signed />
          </div>
        </div>
        <dl className="flow-breakdown">
          <div>
            <dt>
              <ArrowDownLeft size={15} aria-hidden /> Entradas
            </dt>
            <dd>
              <MoneyDisplay cents={incomeCents} />
            </dd>
          </div>
          <div>
            <dt>
              <ArrowUpRight size={15} aria-hidden /> Saídas
            </dt>
            <dd>
              <MoneyDisplay cents={outflowCents} />
            </dd>
          </div>
          <div>
            <dt>
              <ReceiptText size={15} aria-hidden /> Pendentes
            </dt>
            <dd>{pendingCount}</dd>
          </div>
        </dl>
      </section>

      <section
        className="transactions-workspace"
        aria-label={`Movimentos de ${monthLabel(month)}`}
      >
        <TransactionList
          editable
          controls
          initialItems={transactionItems}
          periodLabel={monthLabel(month)}
        />
      </section>
    </div>
  );
}
