import { ArrowRight, FileSpreadsheet, Users } from "lucide-react";
import { createHouseholdAction } from "@/lib/actions/households";

export default function OnboardingPage() {
  return (
    <main className="onboarding-page">
      <div>
        <span className="step-label">Começar · 1 de 2</span>
        <h1>Como chamamos a família?</h1>
        <p>
          Este será o espaço compartilhado. Você poderá convidar a segunda
          pessoa agora ou depois.
        </p>
        <form action={createHouseholdAction}>
          <label>
            Seu nome
            <input
              name="displayName"
              required
              autoComplete="name"
              placeholder="Como prefere ser chamado"
            />
          </label>
          <label>
            Nome da família
            <input
              name="householdName"
              required
              placeholder="Ex.: Família Brunnel"
            />
          </label>
          <button className="button button-primary">
            Criar espaço familiar <ArrowRight size={17} />
          </button>
        </form>
        <div className="onboarding-options">
          <span>
            <Users size={17} />
            Dois administradores equivalentes
          </span>
          <span>
            <FileSpreadsheet size={17} />
            Importação disponível depois
          </span>
        </div>
      </div>
    </main>
  );
}
