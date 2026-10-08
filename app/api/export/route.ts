import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { transactions } from "@/lib/demo-data";
import { toCsv } from "@/lib/domain/export";
import { createClient } from "@/lib/supabase/server";
import type { TransactionItem } from "@/components/finance/transaction-list";

export async function GET(request: Request) {
  const demo =
    process.env.BRUNNEL_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  let exportTransactions: TransactionItem[] = transactions;
  if (!demo) {
    const client = await createClient();
    const { data } = await client!.auth.getUser();
    if (!data.user)
      return Response.json({ error: "Sessão necessária." }, { status: 401 });
    const { data: membership } = await client!
      .from("household_memberships")
      .select("household_id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!membership)
      return Response.json({ error: "Família necessária." }, { status: 403 });
    const [{ data: rows }, { data: categories }] = await Promise.all([
      client!
        .from("transactions")
        .select(
          "id,kind,status,description,amount,occurrence_date,category_id,payment_method,updated_at",
        )
        .eq("household_id", membership.household_id)
        .is("deleted_at", null)
        .order("occurrence_date", { ascending: false }),
      client!
        .from("categories")
        .select("id,name")
        .eq("household_id", membership.household_id),
    ]);
    const categoryNames = new Map(
      (categories ?? []).map((category) => [category.id, category.name]),
    );
    exportTransactions = (rows ?? []).map((row) => ({
      id: row.id,
      date: format(parseISO(row.occurrence_date), "dd MMM", {
        locale: ptBR,
      }).toUpperCase(),
      occurrenceDate: row.occurrence_date,
      description: row.description,
      category:
        row.kind === "transfer"
          ? "Transferência"
          : (categoryNames.get(row.category_id ?? "") ?? "Sem categoria"),
      method: row.payment_method,
      responsible: "Família",
      amountCents:
        Math.round(Number(row.amount) * 100) * (row.kind === "income" ? 1 : -1),
      status: row.status,
      updatedAt: row.updated_at,
    }));
  }
  const exportFormat =
    new URL(request.url).searchParams.get("format") ?? "json";
  if (exportFormat === "csv") {
    const csv = toCsv(
      exportTransactions.map((item) => ({
        data: item.date,
        descricao: item.description,
        categoria: item.category,
        status: item.status,
        responsavel: item.responsible,
        valor_centavos: item.amountCents,
      })),
    );
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=brunnel-lancamentos.csv",
        "Cache-Control": "private, no-store",
      },
    });
  }
  return new Response(
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        source: demo ? "demo" : "supabase",
        transactions: exportTransactions,
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=brunnel-backup.json",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
