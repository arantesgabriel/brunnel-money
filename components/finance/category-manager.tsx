"use client";

import { Archive, PencilLine, Plus, Tags, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/finance/category-icon";
import {
  archiveCategoryAction,
  saveCategoryAction,
} from "@/lib/actions/resources";
import {
  categoryColorLabels,
  categoryColors,
  categoryTypeLabels,
  type CategoryColor,
  type CategoryItem,
  type CategoryType,
} from "@/lib/domain/categories";

export function CategoryManager({
  initialItems,
  editName,
}: {
  initialItems: CategoryItem[];
  editName?: string;
}) {
  const linkedCategory = initialItems.find((item) => item.name === editName);
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<CategoryItem | null>(
    linkedCategory ?? null,
  );
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const deepLinkHandled = useRef(false);

  const open = (category?: CategoryItem) => {
    setSelected(category ?? null);
    dialog.current?.showModal();
  };

  useEffect(() => {
    if (!linkedCategory || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    dialog.current?.showModal();
  }, [linkedCategory]);

  const save = async (formData: FormData) => {
    setSaving(true);
    const result = await saveCategoryAction(selected?.id ?? null, formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const value: CategoryItem = {
      id: selected?.id ?? crypto.randomUUID(),
      name: String(formData.get("name")).trim(),
      type: String(formData.get("type")) as CategoryType,
      color: String(formData.get("color")) as CategoryColor,
      isSystem: selected?.isSystem ?? false,
      archived: false,
    };
    setItems((current) =>
      selected
        ? current.map((item) => (item.id === selected.id ? value : item))
        : [...current, value],
    );
    dialog.current?.close();
    toast.success(result.message);
  };

  const archive = async (category: CategoryItem) => {
    if (!window.confirm(`Arquivar a categoria “${category.name}”?`)) return;
    const result = await archiveCategoryAction(category.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setItems((current) => current.filter((item) => item.id !== category.id));
    toast.success(result.message);
  };

  return (
    <>
      <section
        className="category-workspace"
        aria-labelledby="category-list-title"
      >
        <header className="category-workspace-header">
          <div>
            <h2 id="category-list-title">Categorias ativas</h2>
            <span>{items.length} disponíveis</span>
          </div>
          <button className="button button-primary" onClick={() => open()}>
            <Plus size={17} aria-hidden />
            Nova categoria
          </button>
        </header>
        <div className="category-manager-list">
          {items.map((category) => (
            <article className="category-manager-row" key={category.id}>
              <CategoryIcon
                name={category.name}
                color={category.color}
                size={17}
              />
              <div className="category-manager-copy">
                <strong>{category.name}</strong>
                <span>
                  {categoryTypeLabels[category.type]} ·{" "}
                  {categoryColorLabels[category.color]}
                </span>
              </div>
              {category.isSystem && (
                <span className="category-system-chip">Padrão</span>
              )}
              <div className="category-manager-actions">
                <button
                  className="icon-button"
                  aria-label={`Editar ${category.name}`}
                  onClick={() => open(category)}
                >
                  <PencilLine size={17} />
                </button>
                <button
                  className="icon-button danger-icon"
                  aria-label={`Arquivar ${category.name}`}
                  onClick={() => archive(category)}
                >
                  <Archive size={17} />
                </button>
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <div className="category-empty-state">
              <Tags size={24} aria-hidden />
              <strong>Nenhuma categoria ativa</strong>
              <p>Crie uma categoria para organizar lançamentos e orçamento.</p>
            </div>
          )}
        </div>
      </section>

      <dialog
        ref={dialog}
        className="transaction-dialog category-dialog"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <form
          key={selected?.id ?? "new-category"}
          action={save}
          className="transaction-form"
        >
          <header>
            <div>
              <h2>{selected ? "Editar categoria" : "Nova categoria"}</h2>
              <p>
                Escolha um nome claro e uma cor que será repetida nos gráficos.
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
          <div className="category-form-grid">
            <label>
              Nome
              <input
                name="name"
                required
                minLength={2}
                maxLength={60}
                defaultValue={selected?.name}
                placeholder="Ex.: Cuidados pessoais"
                autoComplete="off"
              />
            </label>
            <label>
              Tipo
              <select name="type" defaultValue={selected?.type ?? "expense"}>
                {Object.entries(categoryTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="category-color-field">
              <legend>Cor nos gráficos</legend>
              <div>
                {categoryColors.map((color) => (
                  <label
                    key={color}
                    className={`category-color-option color-${color}`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={(selected?.color ?? "teal") === color}
                    />
                    <span aria-hidden />
                    <span>{categoryColorLabels[color]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
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
              {saving ? "Salvando…" : "Salvar categoria"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
