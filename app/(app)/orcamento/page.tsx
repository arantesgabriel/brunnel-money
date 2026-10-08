import {
  ArrowLeftRight,
  Copy,
  Info,
  LockKeyhole,
  Tags,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { BudgetList } from "@/components/finance/budget-list";
import { MonthSwitcher } from "@/components/finance/month-switcher";
import { MoneyDisplay } from "@/components/ui/money-display";
import { formatBrl } from "@/lib/domain/money";
import { listBudgetRows, monthLabel, monthParam } from "@/lib/queries/finance";

export const metadata = { title: "Orçamento" };

export default async function BudgetPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const rows = await listBudgetRows(month);
  const allocatedCents = rows.reduce((sum, row) => sum + row.allocated, 0);
  const committedCents = rows.reduce((sum, row) => sum + row.committed, 0);
  const paidCents = rows.reduce((sum, row) => sum + row.paid, 0);
  const pendingCents = committedCents - paidCents;
  const availableCents = Math.max(0, allocatedCents - committedCents);
  const utilization =
    allocatedCents > 0
      ? Math.round((committedCents / allocatedCents) * 100)
      : 0;
  const paidPercentage =
    allocatedCents > 0 ? (paidCents / allocatedCents) * 100 : 0;
  const pendingPercentage =
    allocatedCents > 0 ? (pendingCents / allocatedCents) * 100 : 0;
  const availablePercentage = Math.max(
    0,
    100 - paidPercentage - pendingPercentage,
  );

  return (
    <div className="page budget-page">
      <header className="resource-page-header">
        <div>
          <h1>Orçamento</h1>
          <p>Planejado, comprometido e pago no mês.</p>
        </div>
        <MonthSwitcher month={month} label={monthLabel(month)} />
      </header>

      <section className="budget-overview" aria-labelledby="budget-total-title">
        <div className="budget-total">
          <span className="budget-total-icon" aria-hidden="true">
            <WalletCards size={21} />
          </span>
          <div>
            <span id="budget-total-title">Total alocado</span>
            <MoneyDisplay cents={allocatedCents} />
          </div>
          <div
            className="budget-overview-ring"
            style={
              { "--budget-progress": `${utilization}%` } as React.CSSProperties
            }
            role="img"
            aria-label={`${utilization}% do orçamento comprometido`}
          >
            <span>{utilization}%</span>
          </div>
        </div>

        <div className="budget-overview-detail">
          <dl className="budget-breakdown">
            <div>
              <dt>Comprometido</dt>
              <dd>
                <MoneyDisplay cents={committedCents} />
              </dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>
                <MoneyDisplay cents={paidCents} />
              </dd>
            </div>
            <div>
              <dt>Disponível</dt>
              <dd>
                <MoneyDisplay cents={availableCents} />
              </dd>
            </div>
          </dl>
          <div
            className="budget-flow-bar"
            role="img"
            aria-label={`${formatBrl(paidCents)} pagos, ${formatBrl(pendingCents)} pendentes e ${formatBrl(availableCents)} disponíveis`}
          >
            <span className="paid" style={{ width: `${paidPercentage}%` }} />
            <span
              className="pending"
              style={{ width: `${pendingPercentage}%` }}
            />
            <span
              className="available"
              style={{ width: `${availablePercentage}%` }}
            />
          </div>
          <div className="budget-flow-legend" aria-hidden="true">
            <span className="paid">Pago</span>
            <span className="pending">Pendente</span>
            <span className="available">Livre</span>
          </div>
        </div>
      </section>

      <div className="budget-action-row" aria-label="Ações do orçamento">
        <button type="button" className="button button-quiet">
          <Copy size={17} />
          Copiar mês anterior
        </button>
        <button type="button" className="button button-quiet">
          <ArrowLeftRight size={17} />
          Realocar
        </button>
        <button type="button" className="button button-quiet">
          <LockKeyhole size={17} />
          Fechar mês
        </button>
        <Link href="/configuracoes/categorias" className="button button-quiet">
          <Tags size={17} />
          Categorias
        </Link>
      </div>

      <section className="budget-workspace" aria-labelledby="categories-title">
        <header className="budget-workspace-header">
          <div>
            <h2 id="categories-title">Categorias</h2>
            <span>{rows.length} categorias</span>
          </div>
          <span className="budget-status-chip">{utilization}% utilizado</span>
        </header>
        <BudgetList rows={rows} editable month={month} />
        <footer className="budget-rule-note">
          <Info size={16} aria-hidden="true" />
          <p>Igreja usa 10% das receitas salariais e permite ajuste manual.</p>
        </footer>
      </section>
    </div>
  );
}
