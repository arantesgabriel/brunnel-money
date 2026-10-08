"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createTransactionAction } from "@/lib/actions/transactions";

export function QuickAdd({
  mobile = false,
  nav = false,
}: {
  mobile?: boolean;
  nav?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [mobileFabVisible, setMobileFabVisible] = useState(false);
  const lastScrollPosition = useRef(0);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!mobile || nav) return;

    const updateVisibility = () => {
      const currentScrollPosition = window.scrollY;
      const movingUp = currentScrollPosition < lastScrollPosition.current - 6;
      setMobileFabVisible(currentScrollPosition > 120 && movingUp);
      lastScrollPosition.current = currentScrollPosition;
    };

    lastScrollPosition.current = window.scrollY;
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [mobile, nav]);
  const close = () => dialog.current?.close();
  const save = async (formData: FormData) => {
    setSaving(true);
    const result = await createTransactionAction(formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    close();
    toast.success(result.message);
  };
  return (
    <>
      <button
        className={
          nav
            ? "quick-add-nav"
            : mobile
              ? mobileFabVisible
                ? "quick-add-mobile is-visible"
                : "quick-add-mobile"
              : "button button-primary"
        }
        onClick={() => dialog.current?.showModal()}
        aria-label="Novo lançamento"
        aria-hidden={mobile && !nav && !mobileFabVisible}
        tabIndex={mobile && !nav && !mobileFabVisible ? -1 : undefined}
      >
        <Plus size={19} />
        {mobile ? (
          <span className="sr-only">Novo lançamento</span>
        ) : (
          "Novo lançamento"
        )}
      </button>
      <dialog
        ref={dialog}
        className="transaction-dialog"
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <form action={save} className="transaction-form">
          <header>
            <div>
              <h2>Novo lançamento</h2>
              <p>
                Comece pelo essencial. Os detalhes aparecem quando necessários.
              </p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={close}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </header>
          <div className="form-grid">
            <label>
              Tipo
              <select name="kind" defaultValue="expense">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
            <label>
              Descrição
              <input
                name="description"
                required
                placeholder="Ex.: Mercado do bairro"
                autoComplete="off"
              />
            </label>
            <label>
              Valor
              <input
                name="amount"
                required
                inputMode="decimal"
                placeholder="R$ 0,00"
              />
            </label>
            <label>
              Data
              <input name="date" type="date" required defaultValue={today} />
            </label>
            <label>
              Status
              <select name="status" defaultValue="pending">
                <option value="planned">Planejado</option>
                <option value="pending">Pendente</option>
              </select>
            </label>
            <label>
              Categoria
              <select name="category" defaultValue="Alimentação">
                <option>Alimentação</option>
                <option>Moradia</option>
                <option>Transporte</option>
                <option>Saúde</option>
                <option>Igreja</option>
              </select>
            </label>
          </div>
          <p className="form-note">
            A competência acompanha a data do lançamento. Você poderá editar
            conta, cartão, responsável, recorrência e observações no detalhe.
          </p>
          <footer>
            <button
              type="button"
              className="button button-quiet"
              onClick={close}
            >
              Cancelar
            </button>
            <button className="button button-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar lançamento"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
