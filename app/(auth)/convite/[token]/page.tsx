import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { acceptHouseholdInvitationAction } from "@/lib/actions/households";
import { InvitationAuthBridge } from "@/components/forms/invitation-auth-bridge";
import { getAppContext, isDemoMode } from "@/lib/queries/households";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const context = await getAppContext();
  const canAccept = Boolean(context?.user) && !isDemoMode();
  const loginHref = `/login?next=${encodeURIComponent(`/convite/${token}`)}`;
  return (
    <main className="onboarding-page">
      <div>
        {!isDemoMode() && <InvitationAuthBridge />}
        <Users size={30} />
        <h1>Você recebeu um convite para uma família</h1>
        <p>
          Ao aceitar, vocês verão os mesmos lançamentos, cartões, orçamento e
          metas. Ambos serão administradores.
        </p>
        {canAccept ? (
          <form action={acceptHouseholdInvitationAction.bind(null, token)}>
            <button className="button button-primary">Aceitar convite</button>
          </form>
        ) : (
          <Link className="button button-primary" href={loginHref}>
            Entrar para verificar e aceitar
          </Link>
        )}
        {query?.erro === "convite-invalido" && (
          <p className="inline-error" role="alert">
            Este convite é inválido, expirou ou foi feito para outro e-mail.
          </p>
        )}
        <span className="invite-security">
          <ShieldCheck size={16} />O convite expira em 72 horas e só funciona
          para o e-mail convidado.
        </span>
      </div>
    </main>
  );
}
