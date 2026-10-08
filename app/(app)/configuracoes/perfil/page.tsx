import { LogOut, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/finance/page-header";
import { updateProfileAction } from "@/lib/actions/households";
import { getAppContext } from "@/lib/queries/households";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ salvo?: string }>;
}) {
  const context = await getAppContext();
  if (!context) redirect("/login");
  if (!context.household) redirect("/onboarding");
  const query = await searchParams;
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Perfil e sessão"
        description="Gerencie seu nome e o acesso deste dispositivo."
        month={false}
      />
      <form className="profile-form surface" action={updateProfileAction}>
        <label>
          Nome de exibição
          <input
            name="displayName"
            defaultValue={context.user.name}
            autoComplete="name"
            required
          />
        </label>
        <label>
          Idioma
          <input value="Português (Brasil)" disabled />
        </label>
        <label>
          Fuso horário
          <input value="America/Sao_Paulo" disabled />
        </label>
        <button className="button button-primary">Salvar perfil</button>
      </form>
      {query?.salvo === "1" && (
        <p className="inline-success" role="status">
          Perfil atualizado.
        </p>
      )}
      {query?.salvo === "0" && (
        <p className="inline-error" role="alert">
          Não foi possível atualizar o perfil.
        </p>
      )}
      <div className="session-row">
        <ShieldCheck />
        <div>
          <strong>Este dispositivo</strong>
          <span>Sessão ativa agora · Safari/Chrome</span>
        </div>
        <button className="button danger-button">
          <LogOut size={17} />
          Sair
        </button>
      </div>
      <p className="context-note">
        Para encerrar todas as sessões, redefina o acesso no painel do Supabase
        Auth. O README detalha o procedimento suportado.
      </p>
    </div>
  );
}
