"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseBrlToCents } from "@/lib/domain/money";
import type { ActionResult } from "@/lib/actions/transactions";
import { categoryColors, categoryTypes } from "@/lib/domain/categories";
import { monthStart } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";

const accountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["checking", "wallet", "cash", "savings", "investment"]),
  institution: z.string().trim().max(100).optional(),
  openingBalance: z.string().default("0"),
  countsAsReserve: z.enum(["true", "false"]).default("false"),
});
const cardSchema = z.object({
  name: z.string().trim().min(2).max(100),
  institution: z.string().trim().max(100).optional(),
  network: z.enum(["visa", "mastercard"]),
  lastFour: z.string().regex(/^\d{4}$/),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
  bankLimit: z.string().optional(),
  monthlyGoal: z.string().optional(),
});
const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(categoryTypes),
  color: z.enum(categoryColors),
});
const budgetLineSchema = z.object({
  month: z.iso.date(),
  categoryId: z.string().uuid(),
  allocated: z.string().min(1),
});
const demoMode = () =>
  process.env.BRUNNEL_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

async function context() {
  const supabase = await createClient();
  const { data } = await supabase!.auth.getUser();
  if (!data.user) return null;
  const { data: membership } = await supabase!
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return membership
    ? {
        supabase: supabase!,
        user: data.user,
        householdId: membership.household_id,
      }
    : null;
}

function optionalMoney(value?: string): number | null {
  if (!value?.trim()) return null;
  return parseBrlToCents(value) / 100;
}

export async function saveAccountAction(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "Revise os dados da conta." };
  let openingBalance: number;
  try {
    openingBalance = parseBrlToCents(parsed.data.openingBalance) / 100;
  } catch {
    return { ok: false, message: "Informe um saldo inicial válido." };
  }
  if (demoMode())
    return { ok: true, message: id ? "Conta atualizada." : "Conta criada." };
  const auth = await context();
  if (!auth)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const values = {
    name: parsed.data.name,
    type: parsed.data.type,
    institution: parsed.data.institution || null,
    counts_as_reserve: parsed.data.countsAsReserve === "true",
  };
  const result = id
    ? await auth.supabase
        .from("accounts")
        .update(values)
        .eq("id", id)
        .eq("household_id", auth.householdId)
    : await auth.supabase.from("accounts").insert({
        ...values,
        household_id: auth.householdId,
        opening_balance: openingBalance,
        opening_balance_date: new Date().toISOString().slice(0, 10),
        created_by: auth.user.id,
      });
  if (result.error)
    return {
      ok: false,
      message:
        "Não foi possível salvar a conta. Verifique se o nome já existe.",
    };
  revalidatePath("/contas");
  return { ok: true, message: id ? "Conta atualizada." : "Conta criada." };
}

export async function saveCardAction(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: "Informe bandeira, quatro dígitos e dias entre 1 e 31.",
    };
  let bankLimit: number | null;
  let monthlyGoal: number | null;
  try {
    bankLimit = optionalMoney(parsed.data.bankLimit);
    monthlyGoal = optionalMoney(parsed.data.monthlyGoal);
  } catch {
    return { ok: false, message: "Revise o limite e a meta mensal." };
  }
  if (demoMode())
    return { ok: true, message: id ? "Cartão atualizado." : "Cartão criado." };
  const auth = await context();
  if (!auth)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const values = {
    name: parsed.data.name,
    institution: parsed.data.institution || null,
    network: parsed.data.network,
    last_four: parsed.data.lastFour,
    closing_day: parsed.data.closingDay,
    due_day: parsed.data.dueDay,
    bank_limit: bankLimit,
    monthly_goal: monthlyGoal,
  };
  const result = id
    ? await auth.supabase
        .from("credit_cards")
        .update(values)
        .eq("id", id)
        .eq("household_id", auth.householdId)
    : await auth.supabase.from("credit_cards").insert({
        ...values,
        household_id: auth.householdId,
        created_by: auth.user.id,
      });
  if (result.error)
    return {
      ok: false,
      message:
        "Não foi possível salvar. Já existe um cartão com essa bandeira e final.",
    };
  revalidatePath("/cartoes");
  return { ok: true, message: id ? "Cartão atualizado." : "Cartão criado." };
}

export async function saveCategoryAction(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: "Informe um nome, um tipo e uma cor para a categoria.",
    };
  if (demoMode())
    return {
      ok: true,
      message: id ? "Categoria atualizada." : "Categoria criada.",
    };
  const auth = await context();
  if (!auth)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const values = {
    name: parsed.data.name,
    type: parsed.data.type,
    color: parsed.data.color,
  };
  const result = id
    ? await auth.supabase
        .from("categories")
        .update(values)
        .eq("id", id)
        .eq("household_id", auth.householdId)
    : await auth.supabase.from("categories").insert({
        ...values,
        household_id: auth.householdId,
        created_by: auth.user.id,
      });
  if (result.error)
    return {
      ok: false,
      message:
        "Não foi possível salvar. Já existe uma categoria com esse nome?",
    };
  revalidatePath("/");
  revalidatePath("/orcamento");
  revalidatePath("/configuracoes/categorias");
  return {
    ok: true,
    message: id ? "Categoria atualizada." : "Categoria criada.",
  };
}

export async function archiveCategoryAction(id: string): Promise<ActionResult> {
  if (demoMode()) return { ok: true, message: "Categoria arquivada." };
  const auth = await context();
  if (!auth)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await auth.supabase
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("household_id", auth.householdId);
  if (error)
    return { ok: false, message: "Não foi possível arquivar a categoria." };
  revalidatePath("/");
  revalidatePath("/orcamento");
  revalidatePath("/configuracoes/categorias");
  return { ok: true, message: "Categoria arquivada." };
}

export async function saveBudgetLineAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = budgetLineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "Revise o valor do orçamento." };
  let allocated: number;
  try {
    allocated = parseBrlToCents(parsed.data.allocated) / 100;
  } catch {
    return { ok: false, message: "Informe um valor válido." };
  }
  if (allocated < 0)
    return { ok: false, message: "O valor não pode ser negativo." };
  if (demoMode()) return { ok: true, message: "Orçamento atualizado." };
  const auth = await context();
  if (!auth)
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const month = monthStart(parsed.data.month);
  const { data: budget, error: budgetError } = await auth.supabase
    .from("monthly_budgets")
    .upsert(
      {
        household_id: auth.householdId,
        month,
        created_by: auth.user.id,
      },
      { onConflict: "household_id,month" },
    )
    .select("id")
    .single();
  if (budgetError)
    return { ok: false, message: "Não foi possível abrir o mês do orçamento." };
  const { error } = await auth.supabase.from("budget_lines").upsert(
    {
      household_id: auth.householdId,
      budget_id: budget.id,
      category_id: parsed.data.categoryId,
      allocated,
    },
    { onConflict: "budget_id,category_id" },
  );
  if (error)
    return { ok: false, message: "Não foi possível salvar o orçamento." };
  revalidatePath("/");
  revalidatePath("/orcamento");
  revalidatePath("/mercado");
  return { ok: true, message: "Orçamento atualizado." };
}
