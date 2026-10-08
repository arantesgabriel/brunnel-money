import { SearchX } from "lucide-react";
import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone-state">
      <SearchX size={34} />
      <h1>Esta página não existe</h1>
      <p>O endereço pode ter mudado ou o item não está mais disponível.</p>
      <Link href="/" className="button button-primary">
        Voltar ao início
      </Link>
    </main>
  );
}
