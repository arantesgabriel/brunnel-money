import { MonthSwitcher } from "@/components/finance/month-switcher";

export function PageHeader({
  title,
  description,
  month = true,
  monthValue,
  monthLabel,
}: {
  title: string;
  description: string;
  month?: boolean;
  monthValue?: string;
  monthLabel?: string;
}) {
  return (
    <header className="resource-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {month && <MonthSwitcher month={monthValue} label={monthLabel} />}
    </header>
  );
}
