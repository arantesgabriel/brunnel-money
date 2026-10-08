"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImportPreview {
  preview: boolean;
  sha256: string;
  fileName: string;
  totalRows: number;
  importedRows?: number;
  sheets: Array<{ name: string; recognized: boolean; rows: number }>;
  warnings: string[];
}

export function ImportWorkflow() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (confirm: boolean) => {
    if (!file) {
      toast.error("Escolha uma planilha antes de continuar.");
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    if (confirm) form.set("confirm", "true");
    const response = await fetch("/api/import", {
      method: "POST",
      body: form,
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível importar a planilha.");
      return;
    }
    setPreview(payload);
    toast.success(
      confirm
        ? `${payload.importedRows ?? 0} lançamentos importados.`
        : "Prévia gerada.",
    );
  };

  return (
    <>
      <div className="upload-zone">
        <FileSpreadsheet size={30} />
        <h2>Selecione a planilha atual</h2>
        <p>
          Importamos dados da aba Lançamentos. Nada é gravado antes da
          confirmação.
        </p>
        <label className="button button-primary">
          <Upload size={17} />
          Escolher arquivo
          <input
            className="sr-only"
            type="file"
            name="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
            }}
          />
        </label>
        {file && <span className="upload-file-name">{file.name}</span>}
        <div className="action-row">
          <button
            className="button button-quiet"
            disabled={busy || !file}
            onClick={() => submit(false)}
          >
            {busy ? "Analisando..." : "Analisar"}
          </button>
          <button
            className="button button-primary"
            disabled={busy || !file || !preview?.preview}
            onClick={() => submit(true)}
          >
            {busy ? "Importando..." : "Confirmar importação"}
          </button>
        </div>
      </div>
      {preview && (
        <section className="surface import-preview">
          <div className="section-heading">
            <h2>{preview.preview ? "Prévia" : "Importação concluída"}</h2>
            <span>{preview.totalRows} linhas encontradas</span>
          </div>
          <div className="invoice-list">
            {preview.sheets.map((sheet) => (
              <article key={sheet.name}>
                <FileSpreadsheet size={18} />
                <div>
                  <strong>{sheet.name}</strong>
                  <span>
                    {sheet.recognized ? "Reconhecida" : "Ignorada"} ·{" "}
                    {sheet.rows} linhas
                  </span>
                </div>
              </article>
            ))}
          </div>
          {!preview.preview && (
            <p className="context-note">
              {preview.importedRows ?? 0} lançamentos novos foram gravados.
              Linhas já importadas pelo mesmo arquivo são ignoradas.
            </p>
          )}
        </section>
      )}
    </>
  );
}
