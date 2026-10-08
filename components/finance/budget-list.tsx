import { PencilLine } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/finance/category-icon";
import { saveBudgetLineAction } from "@/lib/actions/resources";
import { budgetRows } from "@/lib/demo-data";
import { formatBrl } from "@/lib/domain/money";
import type { BudgetRowItem } from "@/lib/queries/finance";
import { MoneyDisplay } from "@/components/ui/money-display";
import { Progress } from "@/components/ui/progress";

export function BudgetList({
  rows: initialRows,
  limit,
  home = false,
  prioritize = false,
  editable = false,
  month,
}: {
  rows?: BudgetRowItem[];
  limit?: number;
  home?: boolean;
  prioritize?: boolean;
  editable?: boolean;
  month?: string;
}) {
  const statePriority = { critical: 0, attention: 1, normal: 2 } as const;
  const sourceRows: BudgetRowItem[] =
    initialRows ??
    budgetRows.map((row) => ({
      ...row,
      id: row.name,
      categoryId: null,
    }));
  const rows = prioritize
    ? [...sourceRows].sort((left, right) => {
        const stateDifference =
          statePriority[left.state] - statePriority[right.state];
        if (stateDifference !== 0) return stateDifference;
        const leftRatio = left.committed / left.allocated;
        const rightRatio = right.committed / right.allocated;
        if (leftRatio !== rightRatio) return rightRatio - leftRatio;
        return right.committed - left.committed;
      })
    : sourceRows;

  return (
    <div className={home ? "budget-list home-budget-list" : "budget-list"}>
      {rows.slice(0, limit).map((row) => {
        const ratio = (row.committed / row.allocated) * 100;
        const tone =
          ratio > 100 ? "danger" : ratio >= 80 ? "warning" : "primary";
        const stateLabel =
          ratio > 100
            ? "Acima do limite"
            : ratio >= 100
              ? "No limite"
              : ratio >= 80
                ? "Atenção"
                : "Disponível";
        const remaining = row.allocated - row.committed;
        return (
          <div className="budget-row" key={row.name}>
            <div className="budget-row-main">
              <CategoryIcon name={row.name} size={16} />
              <div className="budget-row-title">
                <strong>{row.name}</strong>
                <span className={`budget-state budget-state-${tone}`}>
                  {stateLabel}
                </span>
              </div>
              <div className="budget-row-trailing">
                <div className="budget-row-amount">
                  <MoneyDisplay cents={row.committed} />
                  <span>
                    de <MoneyDisplay cents={row.allocated} />
                  </span>
                </div>
                {editable && (
                  <Link
                    className="icon-button budget-edit-category"
                    href={{
                      pathname: "/configuracoes/categorias",
                      query: { editar: row.name },
                    }}
                    aria-label={`Editar categoria ${row.name}`}
                  >
                    <PencilLine size={16} />
                  </Link>
                )}
              </div>
            </div>
            <Progress
              value={ratio}
              tone={tone}
              label={`${row.name}: ${Math.round(ratio)}% usado`}
            />
            <div className="budget-row-foot">
              <span>
                Pago <MoneyDisplay cents={row.paid} />
              </span>
              <strong>
                {remaining > 0 ? (
                  <>
                    <MoneyDisplay cents={remaining} /> livre
                  </>
                ) : (
                  "Sem saldo livre"
                )}
              </strong>
            </div>
            {editable && row.categoryId && month && (
              <form
                action={async (formData) => {
                  "use server";
                  await saveBudgetLineAction(formData);
                }}
                className="budget-inline-form"
              >
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="categoryId" value={row.categoryId} />
                <label>
                  Planejado
                  <input
                    name="allocated"
                    inputMode="decimal"
                    defaultValue={formatBrl(row.allocated).replace("R$ ", "")}
                  />
                </label>
                <button className="button button-quiet">Salvar</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
