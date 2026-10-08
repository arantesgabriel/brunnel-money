import {
  ArchiveRestore,
  ChevronRight,
  CircleUserRound,
  DatabaseBackup,
  Download,
  FolderCog,
  Import,
  LogOut,
  Smartphone,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/finance/page-header";
import { listAccounts, listCards } from "@/lib/queries/finance";
import { getAppContext } from "@/lib/queries/households";

export const metadata = { title: "Configurações" };

function groupsFor(
  householdName: string,
  memberCount: number,
  accountCount: number,
  cardCount: number,
  userName: string,
) {
  const administrators = `${memberCount} ${memberCount === 1 ? "administrador" : "administradores"}`;
  const accounts = `${accountCount} ${accountCount === 1 ? "conta" : "contas"}`;
  const cards = `${cardCount} ${cardCount === 1 ? "cartão" : "cartões"}`;
  return [
    {
      title: "Família",
      items: [
        {
          href: "/configuracoes/familia",
          label: "Família e membros",
          detail: `${householdName} · ${administrators}`,
          icon: Users,
        },
        {
          href: "/configuracoes/categorias",
          label: "Categorias e tags",
          detail: "Crie, edite, organize cores e arquive",
          icon: Tags,
        },
        {
          href: "/contas",
          label: "Contas e cartões",
          detail: `${accounts} · ${cards}`,
          icon: FolderCog,
        },
      ],
    },
    {
      title: "Seus dados",
      items: [
        {
          href: "/configuracoes/importar",
          label: "Importar planilha",
          detail: "Prévia segura antes de confirmar",
          icon: Import,
        },
        {
          href: "/api/export?format=json",
          label: "Exportar e backup",
          detail: "JSON completo e CSV por entidade",
          icon: Download,
        },
        {
          href: "/configuracoes/lixeira",
          label: "Lixeira",
          detail: "Recuperação por 30 dias",
          icon: ArchiveRestore,
        },
        {
          href: "/configuracoes/backup",
          label: "Política de backup",
          detail: "Última exportação: ainda não feita",
          icon: DatabaseBackup,
        },
      ],
    },
    {
      title: "Aplicativo",
      items: [
        {
          href: "/instalar",
          label: "Instalar no celular",
          detail: "Safari, Android e modo standalone",
          icon: Smartphone,
        },
        {
          href: "/configuracoes/perfil",
          label: "Perfil e sessão",
          detail: `${userName} · este dispositivo`,
          icon: CircleUserRound,
        },
      ],
    },
  ];
}

export default async function SettingsPage() {
  const context = await getAppContext();
  if (!context) redirect("/login");
  if (!context.household) redirect("/onboarding");
  const [accountItems, cardItems] = await Promise.all([
    listAccounts(),
    listCards(),
  ]);
  const groups = groupsFor(
    context.household.name,
    context.household.members.length,
    accountItems.length,
    cardItems.length,
    context.user.name,
  );
  return (
    <div className="page">
      <PageHeader
        title="Configurações"
        description="Administre a família, classificações, dados e acesso."
        month={false}
      />
      <div className="settings-groups">
        {groups.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <div className="settings-list surface">
              {group.items.map(({ href, label, detail, icon: Icon }) => (
                <Link href={href} key={label}>
                  <span className="settings-icon">
                    <Icon size={19} />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <button className="button danger-button">
        <LogOut size={17} />
        Sair deste dispositivo
      </button>
    </div>
  );
}
