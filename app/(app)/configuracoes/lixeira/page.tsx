import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { TrashList } from "@/components/finance/trash-list";
import { listDeletedTransactions } from "@/lib/queries/finance";

export default async function TrashPage() {
  const items = await listDeletedTransactions();
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Lixeira"
        description="Itens excluídos podem ser restaurados durante 30 dias."
        month={false}
      />
      {items.length > 0 ? (
        <TrashList items={items} />
      ) : (
        <div className="empty-state">
          <div>
            <Trash2 size={28} />
            <h2>A lixeira está vazia</h2>
            <p>
              Quando um lançamento for excluído, ele aparecerá aqui com a data
              limite de recuperação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
