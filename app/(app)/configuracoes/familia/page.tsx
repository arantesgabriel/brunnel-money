import { UserRoundCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/finance/page-header";
import { InviteMemberForm } from "@/components/forms/invite-member-form";
import { getAppContext } from "@/lib/queries/households";

export default async function FamilySettingsPage() {
  const context = await getAppContext();
  if (!context) redirect("/login");
  if (!context.household) redirect("/onboarding");
  const { household } = context;
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Família e membros"
        description="Os dois membros possuem as mesmas permissões administrativas."
        month={false}
      />
      <section>
        <div className="section-heading">
          <h2>Membros ativos</h2>
        </div>
        <div className="member-list surface">
          {household.members.map((member) => (
            <article key={member.id}>
              <span className="avatar">{member.initials}</span>
              <div>
                <strong>{member.name}</strong>
                <span>
                  {member.email ? `${member.email} · ` : ""}Administrador
                </span>
              </div>
              <UserRoundCheck size={18} />
            </article>
          ))}
        </div>
      </section>
      <section className="invite-panel">
        <h2>Convidar alguém da família</h2>
        <p>
          O convite vale por 72 horas, só pode ser usado uma vez e exige o mesmo
          e-mail verificado.
        </p>
        <InviteMemberForm />
      </section>
    </div>
  );
}
