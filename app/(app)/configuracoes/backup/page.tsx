import { DatabaseBackup, Download } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
export default function BackupPage() {
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Exportação e backup"
        description="Baixe uma cópia portátil dos dados da família antes de mudanças importantes."
        month={false}
      />
      <div className="backup-actions">
        <a className="button button-primary" href="/api/export?format=json">
          <DatabaseBackup size={17} />
          Backup completo JSON
        </a>
        <a className="button button-quiet" href="/api/export?format=csv">
          <Download size={17} />
          Lançamentos CSV
        </a>
      </div>
      <p className="context-note">
        CSV neutraliza células iniciadas por =, +, - ou @. Para backup do banco,
        siga o procedimento com `supabase db dump` descrito no README.
      </p>
    </div>
  );
}
