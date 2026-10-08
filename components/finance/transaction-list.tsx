"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "@/lib/actions/transactions";
import { transactions as demoTransactions } from "@/lib/demo-data";
import { formatBrl } from "@/lib/domain/money";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";

export interface TransactionItem {
  id: string;
  date: string;
  occurrenceDate: string;
  description: string;
  category: string;
  method: string;
  responsible: string;
  amountCents: number;
  status: "planned" | "pending" | "paid";
  updatedAt: string;
}

export function TransactionList({
  limit,
  editable = false,
  home = false,
  controls = false,
  initialItems = demoTransactions,
  periodLabel = "Agosto",
}: {
  limit?: number;
  editable?: boolean;
  home?: boolean;
  controls?: boolean;
  initialItems?: TransactionItem[];
  periodLabel?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | TransactionItem["status"]
  >("all");
  const editDialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const visibleItems = items.filter((item) => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.description, item.category, item.method, item.responsible].some(
        (value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      );
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const edit = (item: TransactionItem) => {
    setSelected(item);
    editDialog.current?.showModal();
  };
  const askDelete = (item: TransactionItem) => {
    setSelected(item);
    deleteDialog.current?.showModal();
  };
  const save = async (formData: FormData) => {
    if (!selected) return;
    setSaving(true);
    const result = await updateTransactionAction(
      selected.id,
      selected.updatedAt,
      formData,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const amount = Number(String(formData.get("amount")).replace(/\D/g, ""));
    const status = String(formData.get("status")) as TransactionItem["status"];
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              description: String(formData.get("description")),
              category: String(formData.get("category")),
              occurrenceDate: String(formData.get("date")),
              amountCents: item.amountCents > 0 ? amount : -amount,
              status,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    editDialog.current?.close();
    toast.success(result.message);
  };
  const remove = async () => {
    if (!selected) return;
    setSaving(true);
    const result = await deleteTransactionAction(
      selected.id,
      selected.updatedAt,
    );
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    setItems((current) => current.filter((item) => item.id !== selected.id));
    deleteDialog.current?.close();
    toast.success(result.message);
  };

  return (
    <>
      {controls && (
        <div className="transactions-controls">
          <div className="transactions-controls-row">
            <label className="transactions-search">
              <Search size={17} aria-hidden />
              <span className="sr-only">Buscar lançamento</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar lançamento"
              />
            </label>
            <div
              className="transaction-status-filters"
              aria-label="Filtrar por status"
            >
              {(
                [
                  ["all", "Todos"],
                  ["pending", "Pendentes"],
                  ["paid", "Pagos"],
                  ["planned", "Planejados"],
                ] as const
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="transactions-list-heading">
            <div>
              <h2>{periodLabel}</h2>
              <span aria-live="polite">
                {visibleItems.length}{" "}
                {visibleItems.length === 1 ? "movimento" : "movimentos"}
              </span>
            </div>
          </div>
        </div>
      )}
      <div
        className={
          home ? "transaction-list home-transaction-list" : "transaction-list"
        }
      >
        {visibleItems.slice(0, limit).map((item) => {
          const transfer = item.category === "Transferência";
          const positive = item.amountCents > 0;
          const Icon = transfer
            ? MoveRight
            : positive
              ? ArrowDownLeft
              : ArrowUpRight;
          return (
            <article className="transaction-row" key={item.id}>
              <time>{item.date}</time>
              <span
                className={`transaction-icon ${positive ? "income" : transfer ? "transfer" : "expense"}`}
              >
                <Icon size={17} aria-hidden />
              </span>
              <div className="transaction-copy">
                <strong>{item.description}</strong>
                <span>
                  {item.category}
                  <span aria-hidden="true"> · </span>
                  <span className="transaction-method">{item.method}</span>
                  <span className="transaction-mobile-date">
                    <span aria-hidden="true"> · </span>
                    {item.date.toLocaleLowerCase("pt-BR")}
                  </span>
                </span>
              </div>
              <div className="transaction-meta">
                <MoneyDisplay cents={item.amountCents} signed />
                <StatusBadge status={item.status} />
              </div>
              {editable && (
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Editar ${item.description}`}
                    onClick={() => edit(item)}
                    disabled={transfer}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger-icon"
                    aria-label={`Excluir ${item.description}`}
                    onClick={() => askDelete(item)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {visibleItems.length === 0 && (
          <div className="inline-empty">
            <MoreHorizontal />
            <strong>Nenhum lançamento encontrado</strong>
            <span>Ajuste a busca ou escolha outro status.</span>
          </div>
        )}
      </div>

      <dialog ref={editDialog} className="transaction-dialog">
        <form action={save} className="transaction-form">
          <header>
            <div>
              <h2>Editar lançamento</h2>
              <p>
                As alterações atualizam orçamento, competência e projeções
                relacionadas.
              </p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => editDialog.current?.close()}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </header>
          {selected && (
            <div className="form-grid">
              <input
                type="hidden"
                name="kind"
                value={selected.amountCents > 0 ? "income" : "expense"}
              />
              <label>
                Descrição
                <input
                  name="description"
                  required
                  defaultValue={selected.description}
                />
              </label>
              <label>
                Valor
                <input
                  name="amount"
                  required
                  inputMode="decimal"
                  defaultValue={formatBrl(
                    Math.abs(selected.amountCents),
                  ).replace("R$ ", "")}
                />
              </label>
              <label>
                Data
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={selected.occurrenceDate}
                />
              </label>
              <label>
                Status
                <select name="status" defaultValue={selected.status}>
                  <option value="planned">Planejado</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </label>
              <label>
                Categoria
                <select name="category" defaultValue={selected.category}>
                  {[
                    "Moradia",
                    "Alimentação",
                    "Transporte",
                    "Saúde",
                    "Educação/Trabalho",
                    "Igreja",
                    "Lazer/Vida pessoal",
                    "Dívidas",
                    "Salário",
                    "Receita extra",
                    "Reembolso",
                  ].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <footer>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => editDialog.current?.close()}
            >
              Cancelar
            </button>
            <button className="button button-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </footer>
        </form>
      </dialog>

      <dialog ref={deleteDialog} className="confirm-dialog">
        <div>
          <span className="destructive-symbol">
            <Trash2 />
          </span>
          <h2>Excluir lançamento?</h2>
          <p>
            <strong>{selected?.description}</strong> deixará de participar dos
            cálculos e ficará recuperável na lixeira por 30 dias.
          </p>
          <div>
            <button
              className="button button-quiet"
              onClick={() => deleteDialog.current?.close()}
            >
              Cancelar
            </button>
            <button
              className="button danger-confirm"
              onClick={remove}
              disabled={saving}
            >
              {saving ? "Excluindo…" : "Mover para lixeira"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
