import { PageHeader } from "@/components/finance/page-header";
import { AccountsManager } from "@/components/finance/accounts-manager";
import { listAccounts } from "@/lib/queries/finance";

export const metadata = { title: "Contas" };

export default async function AccountsPage() {
  const accountItems = await listAccounts();
  return (
    <div className="page">
      <PageHeader
        title="Contas"
        description="Saldos calculados a partir do livro manual, pagamentos de fatura, transferências e ajustes explícitos."
        month={false}
      />
      <AccountsManager initialItems={accountItems} />
      <p className="context-note">
        Ajustar saldo exige um motivo e cria um registro de auditoria. O saldo
        inicial nunca é reescrito silenciosamente.
      </p>
    </div>
  );
}
