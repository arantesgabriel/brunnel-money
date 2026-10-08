import { ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { CardsManager } from "@/components/finance/cards-manager";
import {
  listCards,
  listInvoices,
  monthLabel,
  monthParam,
} from "@/lib/queries/finance";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getAppContext } from "@/lib/queries/households";

export const metadata = { title: "Cartões" };

export default async function CardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = monthParam(params?.month);
  const [cardItems, invoiceItems, context] = await Promise.all([
    listCards(),
    listInvoices(month),
    getAppContext(),
  ]);
  return (
    <div className="page">
      <PageHeader
        title="Cartões e faturas"
        description="Compras pertencem à fatura; o pagamento bancário acontece uma única vez."
        monthValue={month}
        monthLabel={monthLabel(month)}
      />
      <CardsManager
        initialItems={cardItems}
        currentInvoiceCents={invoiceItems[0]?.amountCents ?? 0}
        currentUserName={context?.user.name ?? "Titular"}
      />
      <section>
        <div className="section-heading">
          <h2>Faturas</h2>
        </div>
        <div className="invoice-list surface">
          {invoiceItems.map((invoice) => (
            <article key={invoice.id}>
              <ReceiptText />
              <div>
                <strong>{invoice.title}</strong>
                <span>{invoice.subtitle}</span>
              </div>
              <MoneyDisplay cents={invoice.amountCents} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
