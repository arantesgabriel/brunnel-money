"use client";
import { CircleAlert } from "lucide-react";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="standalone-state">
      <CircleAlert size={34} />
      <h1>Não conseguimos abrir esta área</h1>
      <p>
        Seus dados permanecem seguros. Tente novamente; se persistir, informe o
        horário ao suporte.
      </p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
