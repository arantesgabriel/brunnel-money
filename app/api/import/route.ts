import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { monthStart } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 10_000;
const EXPECTED = [
  "painel",
  "lançamentos",
  "orcamento",
  "orçamento",
  "mercadosemana",
  "listas",
  "cartão",
  "cartao",
  "planejamento",
];
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "")
    .toLowerCase();

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value && value.text) return String(value.text);
    if ("result" in value && value.result != null) return String(value.result);
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("");
    }
  }
  return String(value).trim();
}

function parseAmount(value: string): number | null {
  const clean = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(clean);
  return Number.isFinite(amount) && amount !== 0 ? Math.abs(amount) : null;
}

function parseDate(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const demo =
    process.env.BRUNNEL_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  const client = demo ? null : await createClient();
  let authUserId: string | null = null;
  let householdId: string | null = null;
  if (!demo) {
    const { data } = await client!.auth.getUser();
    if (!data.user)
      return Response.json({ error: "Sessão necessária." }, { status: 401 });
    authUserId = data.user.id;
    const { data: membership } = await client!
      .from("household_memberships")
      .select("household_id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!membership)
      return Response.json({ error: "Família necessária." }, { status: 403 });
    householdId = membership.household_id;
  }
  const form = await request.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_BYTES ||
    !file.name.toLowerCase().endsWith(".xlsx")
  )
    return Response.json(
      { error: "Envie um arquivo .xlsx de até 5 MB." },
      { status: 400 },
    );
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  const bytes = arrayBuffer as unknown as Parameters<
    typeof workbook.xlsx.load
  >[0];
  try {
    await workbook.xlsx.load(bytes);
  } catch {
    return Response.json(
      { error: "Não foi possível ler a planilha." },
      { status: 422 },
    );
  }
  let totalRows = 0;
  const sheets = workbook.worksheets.map((sheet) => {
    const rows = Math.max(0, sheet.actualRowCount - 1);
    totalRows += rows;
    return {
      name: sheet.name,
      recognized: EXPECTED.map(normalize).includes(normalize(sheet.name)),
      rows,
    };
  });
  if (totalRows > MAX_ROWS)
    return Response.json(
      { error: `A planilha excede o limite de ${MAX_ROWS} linhas.` },
      { status: 413 },
    );
  const confirm = form.get("confirm") === "true";
  if (!confirm || demo) {
    return Response.json(
      {
        preview: true,
        sha256: createHash("sha256")
          .update(new Uint8Array(arrayBuffer))
          .digest("hex"),
        fileName: file.name,
        totalRows,
        sheets,
        warnings: [
          "“Lançado” será revisado conforme a forma de pagamento.",
          "Vínculos de reembolso com baixa confiança exigem confirmação.",
        ],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const launchSheet = workbook.worksheets.find((sheet) =>
    ["lancamentos", "lançamentos"].includes(normalize(sheet.name)),
  );
  if (!launchSheet)
    return Response.json(
      { error: "A aba Lançamentos não foi encontrada." },
      { status: 422 },
    );
  const headers = new Map<string, number>();
  launchSheet.getRow(1).eachCell((cell, column) => {
    headers.set(normalize(cellText(cell.value)), column);
  });
  const col = (...names: string[]) => {
    for (const name of names) {
      const index = headers.get(normalize(name));
      if (index) return index;
    }
    return null;
  };
  const dateCol = col("data", "ocorrencia", "ocorrência");
  const descriptionCol = col("descricao", "descrição", "lançamento");
  const categoryCol = col("categoria");
  const amountCol = col("valor", "amount");
  const kindCol = col("tipo", "kind");
  const statusCol = col("status", "situacao", "situação");
  if (!dateCol || !descriptionCol || !categoryCol || !amountCol) {
    return Response.json(
      {
        error:
          "A aba Lançamentos precisa ter colunas Data, Descrição, Categoria e Valor.",
      },
      { status: 422 },
    );
  }
  const { data: categories } = await client!
    .from("categories")
    .select("id,name,type")
    .eq("household_id", householdId!);
  const categoryByName = new Map(
    (categories ?? []).map((category) => [normalize(category.name), category]),
  );
  const sha256 = createHash("sha256")
    .update(new Uint8Array(arrayBuffer))
    .digest("hex");
  const { data: batch, error: batchError } = await client!
    .from("import_batches")
    .upsert(
      {
        household_id: householdId!,
        source_filename: file.name,
        sha256,
        status: "completed",
        row_count: Math.max(0, launchSheet.actualRowCount - 1),
        created_by: authUserId!,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "household_id,sha256" },
    )
    .select("id")
    .single();
  if (batchError)
    return Response.json(
      { error: "Não foi possível registrar o lote de importação." },
      { status: 500 },
    );
  const rowsToInsert: Database["public"]["Tables"]["transactions"]["Insert"][] =
    [];
  const errors: string[] = [];
  for (
    let rowIndex = 2;
    rowIndex <= launchSheet.actualRowCount;
    rowIndex += 1
  ) {
    const row = launchSheet.getRow(rowIndex);
    const date = parseDate(cellText(row.getCell(dateCol).value));
    const description = cellText(row.getCell(descriptionCol).value);
    const categoryName = cellText(row.getCell(categoryCol).value);
    const amount = parseAmount(cellText(row.getCell(amountCol).value));
    const category = categoryByName.get(normalize(categoryName));
    if (!date || !description || !amount || !category) {
      errors.push(`Linha ${rowIndex}: dados obrigatórios inválidos.`);
      continue;
    }
    const rawKind = kindCol
      ? normalize(cellText(row.getCell(kindCol).value))
      : "";
    const kind: Database["public"]["Enums"]["transaction_kind"] =
      rawKind.includes("receita") || category.type === "income"
        ? "income"
        : "expense";
    const rawStatus = statusCol
      ? normalize(cellText(row.getCell(statusCol).value))
      : "";
    const status: Database["public"]["Enums"]["transaction_status"] =
      rawStatus.includes("planej")
        ? "planned"
        : rawStatus.includes("pag") || rawStatus.includes("lanc")
          ? "paid"
          : "pending";
    const fingerprint = createHash("sha256")
      .update([date, description, category.id, amount, kind].join("|"))
      .digest("hex");
    rowsToInsert.push({
      household_id: householdId!,
      kind,
      status,
      description,
      amount,
      occurrence_date: date,
      competence_month: monthStart(date),
      category_id: category.id,
      payment_method: "other",
      responsible_user_id: authUserId!,
      created_by: authUserId!,
      paid_at: status === "paid" ? `${date}T12:00:00.000Z` : null,
      origin: "import",
      import_batch_id: batch.id,
      import_fingerprint: fingerprint,
    });
  }
  if (errors.length > 0) {
    return Response.json(
      { error: "Revise a planilha antes de confirmar.", errors },
      { status: 422 },
    );
  }
  const uniqueRowsToInsert = [
    ...new Map(
      rowsToInsert.map((row) => [row.import_fingerprint ?? "", row]),
    ).values(),
  ];
  const { data: existingRows } = await client!
    .from("transactions")
    .select("import_fingerprint")
    .eq("household_id", householdId!)
    .eq("import_batch_id", batch.id)
    .not("import_fingerprint", "is", null);
  const existingFingerprints = new Set(
    (existingRows ?? []).map((row) => row.import_fingerprint),
  );
  const newRows = uniqueRowsToInsert.filter(
    (row) => !existingFingerprints.has(row.import_fingerprint ?? ""),
  );
  const { error } =
    newRows.length > 0
      ? await client!.from("transactions").insert(newRows)
      : { error: null };
  if (error)
    return Response.json(
      { error: "Não foi possível concluir a importação." },
      { status: 500 },
    );
  await client!
    .from("import_batches")
    .update({ imported_count: existingFingerprints.size + newRows.length })
    .eq("id", batch.id);
  return Response.json(
    {
      preview: false,
      sha256,
      fileName: file.name,
      totalRows,
      sheets,
      importedRows: newRows.length,
      warnings: [],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
