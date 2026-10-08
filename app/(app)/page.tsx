import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  CategoryIcon,
  categoryChartColor,
  categoryVisualStyle,
} from "@/components/finance/category-icon";
import { MonthSwitcher } from "@/components/finance/month-switcher";
import { MoneyDisplay } from "@/components/ui/money-display";
import { formatBrl } from "@/lib/domain/money";
import {
  getDashboardData,
  listBudgetRows,
  listTransactions,
  monthLabel,
  monthParam,
  type BudgetRowItem,
  type DashboardData,
} from "@/lib/queries/finance";
import type { TransactionItem } from "@/components/finance/transaction-list";

function AvailableMeter({ percentage }: { percentage: number }) {
  const bounded = Math.min(Math.max(percentage, 0), 100);
  return (
    <div
      className="available-meter"
      role="img"
      aria-label={`${bounded}% da renda está disponível neste mês`}
    >
      <svg viewBox="0 0 176 106" aria-hidden="true">
        <path className="meter-track" d="M18 88a70 70 0 0 1 140 0" />
        <path
          className="meter-value"
          pathLength="100"
          strokeDasharray={`${bounded} ${100 - bounded}`}
          d="M18 88a70 70 0 0 1 140 0"
        />
      </svg>
      <span>
        <strong>{bounded}%</strong>
        <small>da renda</small>
      </span>
    </div>
  );
}

function SpendingDistribution({ rows }: { rows: BudgetRowItem[] }) {
  const ordered = [...rows].sort(
    (left, right) => right.committed - left.committed,
  );
  const total = ordered.reduce((sum, row) => sum + row.committed, 0);
  const segments = ordered.reduce<
    Array<BudgetRowItem & { percentage: number; offset: number }>
  >((result, row) => {
    const percentage = total > 0 ? (row.committed / total) * 100 : 0;
    const previous = result.at(-1);
    const offset = previous ? previous.offset + previous.percentage : 0;
    return [...result, { ...row, percentage, offset }];
  }, []);

  return (
    <section className="dashboard-card distribution-card">
      <header className="card-heading">
        <div>
          <h2>Orçamento</h2>
          <p>
            {total > 0 ? "Distribuição comprometida" : "Sem compromissos ainda"}
          </p>
        </div>
        <Link href="/orcamento" aria-label="Abrir orçamento">
          <ArrowUpRight size={17} aria-hidden />
        </Link>
      </header>
      {total > 0 ? (
        <div className="distribution-content">
          <div
            className="donut-chart"
            role="img"
            aria-label={`Distribuição de ${formatBrl(total)} comprometidos entre ${ordered.length} categorias`}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="donut-track" cx="60" cy="60" r="45" />
              {segments.map((row) => (
                <circle
                  key={row.name}
                  className="donut-segment"
                  cx="60"
                  cy="60"
                  r="45"
                  pathLength="100"
                  stroke={categoryChartColor(row.name)}
                  strokeDasharray={`${Math.max(row.percentage - 0.8, 0)} ${100 - row.percentage + 0.8}`}
                  strokeDashoffset={-row.offset}
                />
              ))}
            </svg>
            <span>
              <small>Comprometido</small>
              <MoneyDisplay cents={total} />
            </span>
          </div>
          <ul className="category-legend">
            {ordered.slice(0, 5).map((row) => (
              <li key={row.name} style={categoryVisualStyle(row.name)}>
                <CategoryIcon name={row.name} />
                <span className="category-name">{row.name}</span>
                <strong>{Math.round((row.committed / total) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="inline-empty">
          <strong>Nada comprometido neste mês</strong>
          <span>Crie lançamentos para formar a distribuição.</span>
        </div>
      )}
    </section>
  );
}

function UpcomingMovements({
  items,
  label,
}: {
  items: TransactionItem[];
  label: string;
}) {
  return (
    <section className="dashboard-card movements-card">
      <header className="card-heading">
        <div>
          <h2>Próximos movimentos</h2>
          <p>{label}</p>
        </div>
        <Link href="/lancamentos" aria-label="Abrir lançamentos">
          <ArrowUpRight size={17} aria-hidden />
        </Link>
      </header>
      <div className="home-movements-list">
        {items.slice(0, 4).map((transaction) => {
          const income = transaction.amountCents > 0;
          const Icon = income ? ArrowDownLeft : ArrowUpRight;
          return (
            <article className="home-movement" key={transaction.id}>
              <span
                className={income ? "movement-icon income" : "movement-icon"}
                aria-hidden="true"
              >
                <Icon size={17} />
              </span>
              <span className="movement-copy">
                <strong>{transaction.description}</strong>
                <small>{transaction.category}</small>
              </span>
              <span className="movement-value">
                <MoneyDisplay cents={transaction.amountCents} signed />
                <time dateTime={transaction.occurrenceDate}>
                  {transaction.date.toLocaleLowerCase("pt-BR")}
                </time>
              </span>
            </article>
          );
        })}
        {items.length === 0 && (
          <div className="inline-empty">
            <strong>Nenhum lançamento no período</strong>
            <span>O próximo movimento aparece aqui assim que for criado.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function InvoiceCard({ invoice }: { invoice: DashboardData["invoice"] }) {
  const percentage = Math.round(
    (invoice.amountCents / Math.max(invoice.goalCents, 1)) * 100,
  );
  return (
    <Link
      href="/cartoes"
      className="dashboard-card compact-finance-card invoice-card"
      aria-label={`Abrir ${invoice.title} de ${formatBrl(invoice.amountCents)}`}
    >
      <header>
        <span className="compact-card-icon invoice-icon" aria-hidden="true">
          <CreditCard size={18} />
        </span>
        <span className="subtle-status attention">{invoice.status}</span>
      </header>
      <div>
        <span className="compact-label">{invoice.title}</span>
        <MoneyDisplay cents={invoice.amountCents} />
      </div>
      <div
        className="compact-progress"
        role="img"
        aria-label={`${percentage}% da meta mensal do cartão usada`}
      >
        <span style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <footer>
        <span>{percentage}% da meta</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </footer>
    </Link>
  );
}

function SavingsCard({ savings }: { savings: DashboardData["savings"] }) {
  const percentage = Math.round(
    (savings.currentCents / Math.max(savings.targetCents, 1)) * 100,
  );
  return (
    <Link
      href="/metas"
      className="dashboard-card compact-finance-card savings-card"
      aria-label={`Abrir meta ${savings.name}, ${percentage}% concluída`}
    >
      <header>
        <span className="compact-card-icon savings-icon" aria-hidden="true">
          <PiggyBank size={18} />
        </span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </header>
      <div className="savings-content">
        <div>
          <span className="compact-label">{savings.name}</span>
          <MoneyDisplay cents={savings.currentCents} />
          <small>de {formatBrl(savings.targetCents)}</small>
        </div>
        <div
          className="goal-ring"
          style={
            {
              "--goal-progress": `${Math.min(percentage, 100)}%`,
            } as React.CSSProperties
          }
          role="img"
          aria-label={`${percentage}% da reserva concluída`}
        >
          <span>{percentage}%</span>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const label = monthLabel(month);
  const [dashboard, rows, transactionItems] = await Promise.all([
    getDashboardData(month),
    listBudgetRows(month),
    listTransactions(month),
  ]);
  const availablePercentage = Math.round(
    (dashboard.safeToSpendCents / Math.max(dashboard.incomeCents, 1)) * 100,
  );
  const categoryTotal = rows.reduce((sum, row) => sum + row.committed, 0);
  const housingAndFood = rows
    .filter((row) => row.name === "Moradia" || row.name === "Alimentação")
    .reduce((sum, row) => sum + row.committed, 0);
  const concentration =
    categoryTotal > 0 ? Math.round((housingAndFood / categoryTotal) * 100) : 0;

  return (
    <div className="page dashboard-page redesigned-home">
      <header className="dashboard-header">
        <div>
          <h1>Visão geral</h1>
          <span className="control-status">
            <span aria-hidden="true" /> Sob controle
          </span>
        </div>
        <MonthSwitcher month={month} label={label} />
      </header>

      <div className="visual-dashboard-grid">
        <section className="dashboard-card available-card">
          <div className="available-main">
            <div className="available-copy">
              <span>Disponível este mês</span>
              <MoneyDisplay cents={dashboard.safeToSpendCents} />
              <span className="available-badge">Dentro do planejado</span>
            </div>
            <AvailableMeter percentage={availablePercentage} />
          </div>
          <dl className="financial-summary">
            <div>
              <dt>Renda</dt>
              <dd>
                <MoneyDisplay cents={dashboard.incomeCents} />
              </dd>
            </div>
            <div>
              <dt>Comprometido</dt>
              <dd>
                <MoneyDisplay cents={dashboard.committedCents} />
              </dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>
                <MoneyDisplay cents={dashboard.paidCents} />
              </dd>
            </div>
          </dl>
          <div className="brunnel-insight">
            <Sparkles size={16} aria-hidden="true" />
            <p>
              Moradia e Alimentação concentram <strong>{concentration}%</strong>
              do orçamento comprometido.
            </p>
          </div>
        </section>

        <SpendingDistribution rows={rows} />
        <UpcomingMovements items={transactionItems} label={label} />
        <div className="compact-card-rail" aria-label="Resumos financeiros">
          <InvoiceCard invoice={dashboard.invoice} />
          <SavingsCard savings={dashboard.savings} />
        </div>
      </div>
    </div>
  );
}
