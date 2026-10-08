"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { monthStart } from "@/lib/domain/dates";
import { parseBrlToCents } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  kind: z.enum(["income", "expense"]),
  description: z.string().trim().min(2).max(200),
  amount: z.string().min(1),
  date: z.iso.date(),
  status: z.enum(["planned", "pending", "paid"]),
  category: z.string().min(1),
});

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const demoMode = () =>
  process.env.BRUNNEL_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

async function authenticatedContext() {
  const supabase = await createClient();
  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user) return null;
  const { data: membership } = await supabase!
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return membership
    ? { supabase: supabase!, user: auth.user, membership }
    : null;
}

export async function createTransactionAction(
  formData: FormData,
): Promise<ActionResult> {
  if (demoMode()) {
    return { ok: true, message: "Lançamento salvo na demonstração." };
  }
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "Revise os campos obrigatórios." };
  let amountCents: number;
  try {
    amountCents = parseBrlToCents(parsed.data.amount);
  } catch {
    return { ok: false, message: "Informe um valor válido em reais." };
  }
  if (amountCents <= 0)
    return { ok: false, message: "O valor precisa ser maior que zero." };
  const supabase = await createClient();
  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { data: membership } = await supabase!
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership)
    return {
      ok: false,
      message: "Crie ou aceite uma família antes de lançar.",
    };
  const { data: category } = await supabase!
    .from("categories")
    .select("id")
    .eq("household_id", membership.household_id)
    .eq("name", parsed.data.category)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  if (!category)
    return { ok: false, message: "A categoria escolhida não está disponível." };
  const { error } = await supabase!.from("transactions").insert({
    household_id: membership.household_id,
    kind: parsed.data.kind,
    status: parsed.data.status,
    description: parsed.data.description,
    amount: amountCents / 100,
    occurrence_date: parsed.data.date,
    competence_month: monthStart(parsed.data.date),
    category_id: category.id,
    payment_method: "other",
    responsible_user_id: auth.user.id,
    created_by: auth.user.id,
  });
  if (error)
    return {
      ok: false,
      message: "Não foi possível salvar. Seus dados não foram alterados.",
    };
  revalidatePath("/");
  revalidatePath("/lancamentos");
  return { ok: true, message: "Lançamento salvo." };
}

export async function updateTransactionAction(
  id: string,
  expectedUpdatedAt: string,
  formData: FormData,
): Promise<ActionResult> {
  if (demoMode()) return { ok: true, message: "Lançamento atualizado." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "Revise os campos obrigatórios." };
  let amountCents: number;
  try {
    amountCents = parseBrlToCents(parsed.data.amount);
  } catch {
    return { ok: false, message: "Informe um valor válido em reais." };
  }
  if (amountCents <= 0)
    return { ok: false, message: "O valor precisa ser maior que zero." };
  const context = await authenticatedContext();
  if (!context)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { data: category } = await context.supabase
    .from("categories")
    .select("id")
    .eq("household_id", context.membership.household_id)
    .eq("name", parsed.data.category)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  if (!category)
    return { ok: false, message: "A categoria escolhida não está disponível." };
  const { data, error } = await context.supabase
    .from("transactions")
    .update({
      kind: parsed.data.kind,
      description: parsed.data.description,
      amount: amountCents / 100,
      occurrence_date: parsed.data.date,
      competence_month: monthStart(parsed.data.date),
      category_id: category.id,
      status: parsed.data.status,
      paid_at: parsed.data.status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("household_id", context.membership.household_id)
    .eq("updated_at", expectedUpdatedAt)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error)
    return { ok: false, message: "Não foi possível atualizar o lançamento." };
  if (!data)
    return {
      ok: false,
      message:
        "Este lançamento foi alterado em outro dispositivo. Recarregue antes de editar.",
    };
  revalidatePath("/");
  revalidatePath("/lancamentos");
  return { ok: true, message: "Lançamento atualizado." };
}

export async function deleteTransactionAction(
  id: string,
  expectedUpdatedAt: string,
): Promise<ActionResult> {
  if (demoMode())
    return { ok: true, message: "Lançamento movido para a lixeira." };
  const context = await authenticatedContext();
  if (!context)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { data, error } = await context.supabase
    .from("transactions")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: context.user.id,
    })
    .eq("id", id)
    .eq("household_id", context.membership.household_id)
    .eq("updated_at", expectedUpdatedAt)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error)
    return { ok: false, message: "Não foi possível excluir o lançamento." };
  if (!data)
    return {
      ok: false,
      message:
        "O lançamento mudou desde que esta tela foi aberta. Recarregue e tente novamente.",
    };
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/configuracoes/lixeira");
  return { ok: true, message: "Lançamento movido para a lixeira por 30 dias." };
}

export async function restoreTransactionAction(
  id: string,
): Promise<ActionResult> {
  if (demoMode()) return { ok: true, message: "Lançamento restaurado." };
  const context = await authenticatedContext();
  if (!context)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await context.supabase
    .from("transactions")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id)
    .eq("household_id", context.membership.household_id)
    .not("deleted_at", "is", null);
  if (error)
    return { ok: false, message: "Não foi possível restaurar o lançamento." };
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/configuracoes/lixeira");
  return { ok: true, message: "Lançamento restaurado." };
}

export async function purgeTransactionAction(
  id: string,
): Promise<ActionResult> {
  if (demoMode()) return { ok: true, message: "Lançamento removido." };
  const context = await authenticatedContext();
  if (!context)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await context.supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("household_id", context.membership.household_id)
    .not("deleted_at", "is", null);
  if (error)
    return { ok: false, message: "Não foi possível remover o lançamento." };
  revalidatePath("/configuracoes/lixeira");
  return { ok: true, message: "Lançamento removido definitivamente." };
}
