"use client";

import { PencilLine, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { saveCardAction } from "@/lib/actions/resources";
import { cards as initialCards } from "@/lib/demo-data";
import { formatBrl } from "@/lib/domain/money";
import { CardBrand } from "@/components/finance/card-brand";
import { MoneyDisplay } from "@/components/ui/money-display";
import { Progress } from "@/components/ui/progress";

export interface CardItem {
  id: string;
  name: string;
  institution: string;
  network: "visa" | "mastercard";
  lastFour: string;
  holder: string;
  closingDay: number;
  dueDay: number;
  bankLimitCents: number;
  monthlyGoalCents: number;
}
type Card = CardItem;

export function CardsManager({
  initialItems = initialCards,
  currentInvoiceCents = 0,
  currentUserName = "Titular",
}: {
  initialItems?: CardItem[];
  currentInvoiceCents?: number;
  currentUserName?: string;
}) {
  const [items, setItems] = useState<Card[]>(initialItems);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editing, setEditing] = useState<Card | null>(null);
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const open = (card?: Card) => {
    setEditing(card ?? null);
    dialog.current?.showModal();
  };
  const save = async (formData: FormData) => {
    setSaving(true);
    const result = await saveCardAction(editing?.id ?? null, formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const card: Card = {
      id: editing?.id ?? crypto.randomUUID(),
      name: String(formData.get("name")),
      institution: String(formData.get("institution") ?? ""),
      network: String(formData.get("network")) as Card["network"],
      lastFour: String(formData.get("lastFour")),
      holder: editing?.holder ?? currentUserName,
      closingDay: Number(formData.get("closingDay")),
      dueDay: Number(formData.get("dueDay")),
      bankLimitCents: Number(
        String(formData.get("bankLimit")).replace(/\D/g, ""),
      ),
      monthlyGoalCents: Number(
        String(formData.get("monthlyGoal")).replace(/\D/g, ""),
      ),
    };
    setItems((current) =>
      editing
        ? current.map((item) => (item.id === editing.id ? card : item))
        : [...current, card],
    );
    setSelectedId(card.id);
    dialog.current?.close();
    toast.success(result.message);
  };
  return (
    <>
      <div className="resource-toolbar">
        <div className="card-tabs" role="tablist" aria-label="Cartões">
          {items.map((card) => (
            <button
              role="tab"
              aria-selected={card.id === selected?.id}
              key={card.id}
              onClick={() => setSelectedId(card.id)}
            >
              <CardBrand network={card.network} compact />
              <span>
                {card.name} •••• {card.lastFour}
              </span>
            </button>
          ))}
        </div>
        <button className="button button-primary" onClick={() => open()}>
          <Plus size={17} />
          Novo cartão
        </button>
      </div>
      {selected && (
        <section className="card-overview">
          <div className="credit-card-visual">
            <div>
              <span>{selected.institution || selected.name}</span>
              <CardBrand network={selected.network} />
            </div>
            <strong>•••• {selected.lastFour}</strong>
            <div>
              <span>{selected.holder}</span>
              <span>fecha dia {selected.closingDay}</span>
            </div>
          </div>
          <div className="card-facts">
            <div>
              <span>Fatura do período</span>
              <MoneyDisplay cents={currentInvoiceCents} />
            </div>
            <Progress
              value={
                selected.monthlyGoalCents
                  ? (currentInvoiceCents / selected.monthlyGoalCents) * 100
                  : 0
              }
              label="Uso da meta mensal"
            />
            <p>
              {selected.monthlyGoalCents ? (
                <>
                  {Math.round(
                    (currentInvoiceCents / selected.monthlyGoalCents) * 100,
                  )}
                  % da meta de{" "}
                  <MoneyDisplay cents={selected.monthlyGoalCents} />.{" "}
                </>
              ) : (
                "Sem meta comportamental. "
              )}
              Limite bancário: <MoneyDisplay cents={selected.bankLimitCents} />.
            </p>
            <div className="action-row">
              <button className="button button-primary">Pagar fatura</button>
              <button
                className="button button-quiet"
                onClick={() => open(selected)}
              >
                <PencilLine size={17} />
                Editar cartão
              </button>
            </div>
          </div>
        </section>
      )}
      <dialog ref={dialog} className="transaction-dialog">
        <form action={save} className="transaction-form">
          <header>
            <div>
              <h2>{editing ? "Editar cartão" : "Novo cartão"}</h2>
              <p>
                Guarde somente a bandeira e os quatro últimos dígitos. Nunca
                informe o número completo.
              </p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => dialog.current?.close()}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </header>
          <div className="form-grid">
            <label>
              Apelido
              <input
                name="name"
                required
                defaultValue={editing?.name}
                placeholder="Ex.: Santander principal"
              />
            </label>
            <label>
              Instituição
              <input name="institution" defaultValue={editing?.institution} />
            </label>
            <label>
              Bandeira
              <select name="network" defaultValue={editing?.network ?? "visa"}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
              </select>
            </label>
            <label>
              4 últimos dígitos
              <input
                name="lastFour"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                defaultValue={editing?.lastFour}
                placeholder="0000"
                autoComplete="off"
              />
            </label>
            <label>
              Dia de fechamento
              <input
                name="closingDay"
                required
                type="number"
                min="1"
                max="31"
                defaultValue={editing?.closingDay ?? 7}
              />
            </label>
            <label>
              Dia de vencimento
              <input
                name="dueDay"
                required
                type="number"
                min="1"
                max="31"
                defaultValue={editing?.dueDay ?? 12}
              />
            </label>
            <label>
              Limite bancário
              <input
                name="bankLimit"
                inputMode="decimal"
                defaultValue={
                  editing
                    ? formatBrl(editing.bankLimitCents).replace("R$ ", "")
                    : ""
                }
                placeholder="Opcional"
              />
            </label>
            <label>
              Meta mensal
              <input
                name="monthlyGoal"
                inputMode="decimal"
                defaultValue={
                  editing
                    ? formatBrl(editing.monthlyGoalCents).replace("R$ ", "")
                    : ""
                }
                placeholder="Opcional"
              />
            </label>
          </div>
          <footer>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </button>
            <button className="button button-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar cartão"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
