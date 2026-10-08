"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/queries/households";

const householdSchema = z.object({
  householdName: z.string().trim().min(2).max(100),
  displayName: z.string().trim().min(2).max(100),
});

const invitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export interface InvitationActionResult {
  ok: boolean;
  message: string;
  inviteUrl?: string;
}

function invitationHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl(path: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configured || "http://localhost:3000";
  return new URL(path, origin).toString();
}

export async function createHouseholdAction(formData: FormData) {
  const parsed = householdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("create_household", {
    household_name: parsed.data.householdName,
    display_name: parsed.data.displayName,
  });
  if (!error) redirect("/");
}

export async function createHouseholdInvitationAction(
  formData: FormData,
): Promise<InvitationActionResult> {
  if (isDemoMode()) {
    return {
      ok: false,
      message: "Convites ficam disponíveis quando o Supabase está configurado.",
    };
  }

  const parsed = invitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Supabase não está configurado." };
  }
  const admin = createServiceRoleClient();
  if (!admin) {
    return {
      ok: false,
      message: "Configure SUPABASE_SERVICE_ROLE_KEY para enviar convites.",
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  }

  const { data: membership } = await supabase
    .from("household_memberships")
    .select("household_id")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return { ok: false, message: "Crie um espaço familiar antes de convidar." };
  }

  const { count: memberCount } = await supabase
    .from("household_memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("household_id", membership.household_id)
    .eq("status", "active");
  if ((memberCount ?? 0) >= 2) {
    return {
      ok: false,
      message: "Este espaço familiar já possui os dois membros permitidos.",
    };
  }

  const email = parsed.data.email;
  if (email === auth.user.email?.trim().toLowerCase()) {
    return { ok: false, message: "Use o e-mail da outra pessoa da família." };
  }

  const { data: pendingInvitation } = await supabase
    .from("household_invitations")
    .select("id")
    .eq("household_id", membership.household_id)
    .eq("email_normalized", email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (pendingInvitation) {
    return {
      ok: false,
      message: "Já existe um convite ativo para este e-mail.",
    };
  }

  const token = randomBytes(32).toString("base64url");
  const { data: invitation, error: invitationError } = await supabase
    .from("household_invitations")
    .insert({
      household_id: membership.household_id,
      email_normalized: email,
      token_hash: invitationHash(token),
      created_by: auth.user.id,
    })
    .select("id")
    .single();
  if (invitationError || !invitation) {
    return { ok: false, message: "Não foi possível criar o convite." };
  }

  const inviteUrl = appUrl(`/convite/${encodeURIComponent(token)}`);
  const { error: mailError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteUrl,
  });
  if (mailError) {
    const existingUser =
      /already.*(registered|exists)|registered.*already/i.test(
        mailError.message,
      );
    if (existingUser) {
      return {
        ok: true,
        message:
          "Esta pessoa já possui uma conta. Compartilhe o link para ela entrar e aceitar o convite.",
        inviteUrl,
      };
    }
    await supabase
      .from("household_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitation.id)
      .eq("household_id", membership.household_id);
    return {
      ok: false,
      message:
        "Não foi possível enviar o convite. Confira o provedor de e-mail.",
    };
  }

  return {
    ok: true,
    message: "Convite enviado. O link também está disponível para copiar.",
    inviteUrl,
  };
}

export async function acceptHouseholdInvitationAction(
  rawToken: string,
  _formData: FormData,
) {
  void _formData;
  const token = z.string().min(32).safeParse(rawToken);
  if (!token.success || isDemoMode()) {
    redirect(`/convite/${encodeURIComponent(rawToken)}?erro=convite-invalido`);
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect(`/convite/${encodeURIComponent(rawToken)}?erro=convite-invalido`);
  }

  const { error } = await supabase.rpc("accept_household_invitation", {
    raw_token: rawToken,
  });
  if (error) {
    redirect(`/convite/${encodeURIComponent(rawToken)}?erro=convite-invalido`);
  }
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const parsed = z
    .object({ displayName: z.string().trim().min(2).max(100) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success || isDemoMode()) {
    redirect("/configuracoes/perfil?salvo=0");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/configuracoes/perfil?salvo=0");
  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user) redirect("/login");
  const { error } = await supabase!.from("profiles").upsert({
    id: auth.user.id,
    display_name: parsed.data.displayName,
  });
  redirect(`/configuracoes/perfil?salvo=${error ? "0" : "1"}`);
}
