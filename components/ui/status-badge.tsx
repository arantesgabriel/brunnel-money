import { Check, Clock3, CircleDashed } from "lucide-react";

const labels = {
  planned: "Planejado",
  pending: "Pendente",
  paid: "Pago",
} as const;

export function StatusBadge({ status }: { status: keyof typeof labels }) {
  const Icon =
    status === "paid" ? Check : status === "pending" ? Clock3 : CircleDashed;
  return (
    <span className={`status status-${status}`}>
      <Icon aria-hidden size={13} />
      {labels[status]}
    </span>
  );
}
