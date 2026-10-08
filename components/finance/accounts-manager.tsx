"use client";

import { Landmark, PencilLine, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { saveAccountAction } from "@/lib/actions/resources";
import { accounts as initialAccounts } from "@/lib/demo-data";
import { MoneyDisplay } from "@/components/ui/money-display";

export interface AccountItem {
  id: string;
  name: string;
  type: "checking" | "wallet" | "cash" | "savings" | "investment";
  institution: string;
  balanceCents: number;
  updated: string;
  countsAsReserve: boolean;
}
type Account = AccountItem;
const labels = {
  checking: "Conta corrente",
  wallet: "Carteira digital",
  cash: "Dinheiro",
  savings: "Reserva",
  investment: "Investimento",
} as const;

export function AccountsManager({
  initialItems = initialAccounts,
}: {
  initialItems?: AccountItem[];
}) {
  const [items, setItems] = useState<Account[]>(initialItems);
  const [selected, setSelected] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = (account?: Account) => {
    setSelected(account ?? null);
    dialog.current?.showModal();
  };
  const save = async (formData: FormData) => {
    setSaving(true);
    const result = await saveAccountAction(selected?.id ?? null, formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const value: Account = {
      id: selected?.id ?? crypto.randomUUID(),
      name: String(formData.get("name")),
      type: String(formData.get("type")) as Account["type"],
      institution: String(formData.get("institution") ?? ""),
      balanceCents:
        selected?.balanceCents ??
        Number(String(formData.get("openingBalance")).replace(/\D/g, "")),
      updated: "agora",
      countsAsReserve: formData.get("countsAsReserve") === "true",
    };
    setItems((current) =>
      selected
        ? current.map((item) => (item.id === selected.id ? value : item))
        : [...current, value],
    );
    dialog.current?.close();
    toast.success(result.message);
  };
  return (
    <>
      <div className="resource-toolbar">
        <span>{items.length} contas ativas</span>
        <button className="button button-primary" onClick={() => open()}>
          <Plus size={17} />
          Nova conta
        </button>
      </div>
      <div className="account-list">
        {items.map((account) => (
          <article className="surface account-row" key={account.id}>
            <span className="account-icon">
              <Landmark size={20} />
            </span>
            <div>
              <strong>{account.name}</strong>
              <span>
                {labels[account.type]}
                {account.institution ? ` · ${account.institution}` : ""} ·
                atualizado {account.updated}
              </span>
            </div>
            <MoneyDisplay cents={account.balanceCents} />
            <button
              className="icon-button"
              aria-label={`Editar ${account.name}`}
              onClick={() => open(account)}
            >
              <PencilLine size={18} />
            </button>
          </article>
        ))}
      </div>
      <dialog ref={dialog} className="transaction-dialog">
        <form action={save} className="transaction-form">
          <header>
            <div>
              <h2>{selected ? "Editar conta" : "Nova conta"}</h2>
              <p>
                O saldo é calculado pelo histórico. Alterações posteriores
                exigem um ajuste com motivo.
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
              Nome
              <input
                name="name"
                required
                defaultValue={selected?.name}
                placeholder="Ex.: Conta principal"
              />
            </label>
            <label>
              Tipo
              <select name="type" defaultValue={selected?.type ?? "checking"}>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Instituição
              <input
                name="institution"
                defaultValue={selected?.institution}
                placeholder="Opcional"
              />
            </label>
            {!selected && (
              <label>
                Saldo inicial
                <input
                  name="openingBalance"
                  inputMode="decimal"
                  defaultValue="0,00"
                />
              </label>
            )}
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="countsAsReserve"
                value="true"
                defaultChecked={selected?.countsAsReserve}
              />
              <span>Esta conta compõe a reserva</span>
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
              {saving ? "Salvando…" : "Salvar conta"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
