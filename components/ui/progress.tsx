export function Progress({
  value,
  tone = "primary",
  label,
}: {
  value: number;
  tone?: "primary" | "warning" | "danger" | "success";
  label: string;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <span
        className={`progress-fill progress-${tone}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
