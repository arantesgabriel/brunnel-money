export function CardBrand({
  network,
  compact = false,
}: {
  network: "visa" | "mastercard";
  compact?: boolean;
}) {
  if (network === "visa")
    return (
      <span
        className={`card-brand visa-brand ${compact ? "compact" : ""}`}
        aria-label="Visa"
      >
        VISA
      </span>
    );
  return (
    <span
      className={`card-brand mastercard-brand ${compact ? "compact" : ""}`}
      aria-label="Mastercard"
    >
      <i />
      <i />
      <b>{compact ? "MC" : "mastercard"}</b>
    </span>
  );
}
