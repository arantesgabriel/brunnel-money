import { Share, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";

export default function InstallPage() {
  return (
    <div className="page narrow-page">
      <PageHeader
        title="Instalar Brunnel"
        description="Use como app no iPhone sem App Store ou Apple Developer Program."
        month={false}
      />
      <div className="install-guide surface">
        <Smartphone size={32} />
        <ol>
          <li>
            <span>1</span>
            <p>
              Abra este endereço no <strong>Safari</strong>.
            </p>
          </li>
          <li>
            <span>2</span>
            <p>
              Toque em <strong>Compartilhar</strong>{" "}
              <Share size={15} aria-label="ícone compartilhar" />.
            </p>
          </li>
          <li>
            <span>3</span>
            <p>
              Escolha <strong>Adicionar à Tela de Início</strong>.
            </p>
          </li>
          <li>
            <span>4</span>
            <p>
              Ative <strong>Abrir como App da Web</strong> e confirme.
            </p>
          </li>
        </ol>
        <p className="context-note">
          O app é online-first. Sem internet, mostra apenas uma tela segura e
          não armazena seus dados financeiros no cache.
        </p>
      </div>
    </div>
  );
}
