import { CalendarDays, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { MoneyDisplay } from "@/components/ui/money-display";
import { Progress } from "@/components/ui/progress";
import { listSavingsGoals } from "@/lib/queries/finance";

export const metadata = { title: "Metas" };

export default async function GoalsPage() {
  const goals = await listSavingsGoals();
  return (
    <div className="page">
      <PageHeader
        title="Metas de reserva"
        description="Cada contribuição é uma transferência patrimonial, nunca uma despesa comum."
        month={false}
      />
      {goals.length > 0 ? (
        goals.map((goal) => {
          const progress = Math.round(
            (goal.currentCents / Math.max(goal.targetCents, 1)) * 100,
          );
          const remaining = Math.max(0, goal.targetCents - goal.currentCents);
          return (
            <section className="goal-detail surface" key={goal.id}>
              <div className="goal-icon">
                <PiggyBank size={24} />
              </div>
              <div className="goal-copy">
                <div>
                  <h2>{goal.name}</h2>
                  {goal.targetDate && (
                    <span>
                      <CalendarDays size={14} /> Meta para{" "}
                      {new Date(goal.targetDate).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <div className="goal-values">
                  <strong>
                    <MoneyDisplay cents={goal.currentCents} />
                  </strong>
                  <span>
                    de <MoneyDisplay cents={goal.targetCents} />
                  </span>
                </div>
                <Progress
                  value={progress}
                  tone="success"
                  label={`${progress}% da meta ${goal.name}`}
                />
                <p>
                  Faltam <MoneyDisplay cents={remaining} /> para concluir esta
                  meta.
                </p>
              </div>
            </section>
          );
        })
      ) : (
        <div className="empty-state">
          <div>
            <PiggyBank size={28} />
            <h2>Nenhuma meta ativa</h2>
            <p>
              Crie uma conta marcada como reserva e uma meta para acompanhar o
              progresso aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
