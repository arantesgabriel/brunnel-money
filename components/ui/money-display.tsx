import { formatBrl } from "@/lib/domain/money";

export function MoneyDisplay({
  cents,
  signed = false,
  className = "",
}: {
  cents: number;
  signed?: boolean;
  className?: string;
}) {
  const prefix = signed && cents > 0 ? "+" : "";
  return (
    <span className={`money ${className}`}>
      {prefix}
      {formatBrl(cents)}
    </span>
  );
}
