import { PageHeader } from "@/components/finance/page-header";
import { MoneyDisplay } from "@/components/ui/money-display";
import { listProjection, monthLabel, monthParam } from "@/lib/queries/finance";

export const metadata = { title: "Planejamento" };

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const projection = await listProjection(month);
  return (
    <div className="page">
      <PageHeader
        title="Próximos seis meses"
        description={`A partir de ${monthLabel(month)}: renda, recorrências, faturas, extras e aportes conhecidos.`}
        monthValue={month}
        monthLabel={monthLabel(month)}
      />
      <div
        className="projection-table surface"
        role="region"
        aria-label="Projeção financeira"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Renda</th>
              <th>Recorrentes</th>
              <th>Faturas</th>
              <th>Extras</th>
              <th>Aportes</th>
              <th>Saldo projetado</th>
            </tr>
          </thead>
          <tbody>
            {projection.map((row) => (
              <tr key={row.month}>
                <th>{row.month}</th>
                <td>
                  <MoneyDisplay cents={row.income} />
                </td>
                <td>
                  <MoneyDisplay cents={row.recurring} />
                </td>
                <td>
                  <MoneyDisplay cents={row.invoices} />
                </td>
                <td>
                  <MoneyDisplay cents={row.extras} />
                </td>
                <td>
                  <MoneyDisplay cents={row.savings} />
                </td>
                <td className={row.balance < 0 ? "negative" : "positive"}>
                  <MoneyDisplay cents={row.balance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="context-note">
        O saldo considera apenas itens conhecidos. Lançamentos planejados
        aparecem como cenário e não alteram o valor seguro do mês atual.
      </p>
    </div>
  );
}
