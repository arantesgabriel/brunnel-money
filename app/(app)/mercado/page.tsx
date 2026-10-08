import { CalendarDays, ShoppingBasket } from "lucide-react";
import { MonthSwitcher } from "@/components/finance/month-switcher";
import { MoneyDisplay } from "@/components/ui/money-display";
import { Progress } from "@/components/ui/progress";
import { listMarketWeeks, monthLabel, monthParam } from "@/lib/queries/finance";

export const metadata = { title: "Mercado" };

export default async function MarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const weeks = await listMarketWeeks(month);
  const allocatedCents = weeks.reduce((sum, week) => sum + week.allocated, 0);
  const spentCents = weeks.reduce((sum, week) => sum + week.spent, 0);
  const availableCents = allocatedCents - spentCents;
  const utilization =
    allocatedCents > 0 ? Math.round((spentCents / allocatedCents) * 100) : 0;

  return (
    <div className="page market-page">
      <header className="resource-page-header">
        <div>
          <h1>Mercado</h1>
          <p>Acompanhe Alimentação sem perder o limite do mês.</p>
        </div>
        <MonthSwitcher month={month} label={monthLabel(month)} />
      </header>

      <section
        className="market-overview"
        aria-labelledby="market-balance-title"
      >
        <div className="market-balance">
          <span className="market-balance-icon" aria-hidden>
            <ShoppingBasket size={21} />
          </span>
          <div>
            <span id="market-balance-title">Disponível para compras</span>
            <MoneyDisplay cents={availableCents} />
            <small>{utilization}% do valor mensal já utilizado</small>
          </div>
          <div
            className="market-overview-ring"
            style={
              { "--market-progress": `${utilization}%` } as React.CSSProperties
            }
            role="img"
            aria-label={`${utilization}% do orçamento de mercado utilizado`}
          >
            <span>{utilization}%</span>
          </div>
        </div>
        <dl className="market-breakdown">
          <div>
            <dt>Planejado</dt>
            <dd>
              <MoneyDisplay cents={allocatedCents} />
            </dd>
          </div>
          <div>
            <dt>Gasto</dt>
            <dd>
              <MoneyDisplay cents={spentCents} />
            </dd>
          </div>
          <div>
            <dt>Disponível</dt>
            <dd>
              <MoneyDisplay cents={availableCents} />
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="market-workspace"
        aria-labelledby="market-weeks-title"
      >
        <header className="market-workspace-header">
          <div>
            <h2 id="market-weeks-title">Semanas do mês</h2>
            <span>{weeks.length} períodos planejados</span>
          </div>
          <span className="market-status-chip">{utilization}% utilizado</span>
        </header>
        <div className="market-week-list">
          {weeks.map((week, index) => {
            const ratio =
              week.allocated > 0 ? (week.spent / week.allocated) * 100 : 0;
            const tone =
              ratio > 100 ? "danger" : ratio >= 70 ? "warning" : "primary";
            const state =
              ratio > 100
                ? "Acima do limite"
                : ratio >= 90
                  ? "Segurar"
                  : ratio >= 70
                    ? "Atenção"
                    : index > 2
                      ? "Planejada"
                      : "No ritmo";
            const remaining = week.allocated - week.spent;

            return (
              <article className="market-week-row" key={week.label}>
                <span className="market-week-icon" aria-hidden>
                  <CalendarDays size={17} />
                </span>
                <div className="market-week-main">
                  <div className="market-week-copy">
                    <div>
                      <strong>Semana {index + 1}</strong>
                      <span>{week.label}</span>
                    </div>
                    <div>
                      <strong>
                        <MoneyDisplay cents={week.spent} />
                      </strong>
                      <span>
                        de <MoneyDisplay cents={week.allocated} />
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={ratio}
                    tone={tone}
                    label={`Semana ${index + 1}: ${Math.round(ratio)}% usado`}
                  />
                  <div className="market-week-foot">
                    <span>{Math.round(ratio)}% utilizado</span>
                    <strong>
                      {remaining >= 0 ? (
                        <>
                          <MoneyDisplay cents={remaining} /> livre
                        </>
                      ) : (
                        <>
                          <MoneyDisplay cents={Math.abs(remaining)} /> acima
                        </>
                      )}
                    </strong>
                  </div>
                </div>
                <span className={`market-week-state market-week-state-${tone}`}>
                  {state}
                </span>
              </article>
            );
          })}
        </div>
        <footer className="market-rule-note">
          Sobras e excessos ajustam apenas o disponível do mês; as próximas
          semanas mantêm o valor planejado.
        </footer>
      </section>
    </div>
  );
}
