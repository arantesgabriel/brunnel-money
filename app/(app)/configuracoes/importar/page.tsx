import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { ImportWorkflow } from "@/components/finance/import-workflow";

export default function ImportPage() {
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Importar planilha"
        description="O arquivo é analisado no servidor e nada é gravado antes da confirmação."
        month={false}
      />
      <ol className="stepper">
        <li className="active">
          <span>1</span>
          <div>
            <strong>Enviar</strong>
            <small>.xlsx até 5 MB</small>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Analisar</strong>
            <small>Abas e colunas</small>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Revisar</strong>
            <small>Ambiguidades</small>
          </div>
        </li>
        <li>
          <span>4</span>
          <div>
            <strong>Confirmar</strong>
            <small>Importação atômica</small>
          </div>
        </li>
      </ol>
      <ImportWorkflow />
      <div className="security-note">
        <ShieldCheck size={20} />
        <p>
          <strong>Prévia protegida e idempotente.</strong> O hash do arquivo e a
          impressão de cada linha evitam duplicidade. Qualquer erro cancela o
          lote inteiro.
        </p>
      </div>
    </div>
  );
}
