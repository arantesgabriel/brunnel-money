import { addMonths, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function normalizeMonth(value?: string): Date {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return new Date();
  return parse(value, "yyyy-MM", new Date());
}

export function MonthSwitcher({
  month,
  label,
}: {
  month?: string;
  label?: string;
}) {
  const date = normalizeMonth(month);
  const currentLabel =
    label ??
    format(date, "MMM yyyy", { locale: ptBR }).replace(".", "").toUpperCase();
  const previous = format(addMonths(date, -1), "yyyy-MM");
  const next = format(addMonths(date, 1), "yyyy-MM");
  return (
    <div className="compact-month-switcher" aria-label="Selecionar mês">
      <Link href={`?month=${previous}`} aria-label="Mês anterior">
        <ChevronLeft size={17} />
      </Link>
      <strong>{currentLabel}</strong>
      <Link href={`?month=${next}`} aria-label="Próximo mês">
        <ChevronRight size={17} />
      </Link>
    </div>
  );
}
