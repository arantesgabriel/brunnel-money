"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  purgeTransactionAction,
  restoreTransactionAction,
} from "@/lib/actions/transactions";
import { MoneyDisplay } from "@/components/ui/money-display";
import type { TrashTransactionItem } from "@/lib/queries/finance";

export function TrashList({ items }: { items: TrashTransactionItem[] }) {
  const [rows, setRows] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);

  const act = async (
    id: string,
    action: (id: string) => Promise<{ ok: boolean; message: string }>,
  ) => {
    setSavingId(id);
    const result = await action(id);
    setSavingId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setRows((current) => current.filter((item) => item.id !== id));
    toast.success(result.message);
  };

  return (
    <div className="transaction-list">
      {rows.map((item) => (
        <article className="transaction-row" key={item.id}>
          <time>{item.date}</time>
          <span className="transaction-icon expense">
            <Trash2 size={17} aria-hidden />
          </span>
          <div className="transaction-copy">
            <strong>{item.description}</strong>
            <span>
              {item.category} · recuperável até{" "}
              {new Date(item.recoverableUntil).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="transaction-meta">
            <MoneyDisplay cents={item.amountCents} signed />
          </div>
          <div className="row-actions">
            <button
              className="icon-button"
              aria-label={`Restaurar ${item.description}`}
              disabled={savingId === item.id}
              onClick={() => act(item.id, restoreTransactionAction)}
            >
              <RotateCcw size={17} />
            </button>
            <button
              className="icon-button danger-icon"
              aria-label={`Remover definitivamente ${item.description}`}
              disabled={savingId === item.id}
              onClick={() => act(item.id, purgeTransactionAction)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
