import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="standalone-state">
      <WifiOff size={34} />
      <h1>Sem conexão por enquanto</h1>
      <p>
        Por segurança, seus dados financeiros não são armazenados offline.
        Reconecte-se e tente novamente.
      </p>
      <Link className="button button-primary" href="/">
        Tentar de novo
      </Link>
    </main>
  );
}
