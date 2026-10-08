import {
  CarFront,
  Church,
  GraduationCap,
  House,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import type { CategoryColor } from "@/lib/domain/categories";

const colorVariables: Record<
  CategoryColor,
  { chartColor: string; inkColor: string }
> = {
  teal: {
    chartColor: "var(--chart-teal)",
    inkColor: "var(--chart-teal-ink)",
  },
  aqua: {
    chartColor: "var(--chart-aqua)",
    inkColor: "var(--chart-aqua-ink)",
  },
  blue: {
    chartColor: "var(--chart-blue)",
    inkColor: "var(--chart-blue-ink)",
  },
  amber: {
    chartColor: "var(--chart-amber)",
    inkColor: "var(--chart-amber-ink)",
  },
  coral: {
    chartColor: "var(--chart-coral)",
    inkColor: "var(--chart-coral-ink)",
  },
  green: {
    chartColor: "var(--chart-green)",
    inkColor: "var(--chart-green-ink)",
  },
};

const categoryVisuals: Record<
  string,
  { icon: LucideIcon; tone: number; chartColor: string; inkColor: string }
> = {
  Moradia: {
    icon: House,
    tone: 1,
    chartColor: "var(--chart-teal)",
    inkColor: "var(--chart-teal-ink)",
  },
  Alimentação: {
    icon: UtensilsCrossed,
    tone: 2,
    chartColor: "var(--chart-aqua)",
    inkColor: "var(--chart-aqua-ink)",
  },
  "Educação/Trabalho": {
    icon: GraduationCap,
    tone: 3,
    chartColor: "var(--chart-blue)",
    inkColor: "var(--chart-blue-ink)",
  },
  Igreja: {
    icon: Church,
    tone: 4,
    chartColor: "var(--chart-amber)",
    inkColor: "var(--chart-amber-ink)",
  },
  "Lazer/Vida pessoal": {
    icon: Sparkles,
    tone: 5,
    chartColor: "var(--chart-coral)",
    inkColor: "var(--chart-coral-ink)",
  },
  Transporte: {
    icon: CarFront,
    tone: 6,
    chartColor: "var(--chart-green)",
    inkColor: "var(--chart-green-ink)",
  },
};

const fallback = {
  icon: Sparkles,
  tone: 1,
  chartColor: "var(--chart-teal)",
  inkColor: "var(--chart-teal-ink)",
};

export function categoryChartColor(name: string) {
  return (categoryVisuals[name] ?? fallback).chartColor;
}

export function categoryVisualStyle(name: string) {
  const visual = categoryVisuals[name] ?? fallback;
  return {
    "--category-color": visual.chartColor,
    "--category-ink": visual.inkColor,
  } as CSSProperties;
}

export function CategoryIcon({
  name,
  size = 15,
  color,
}: {
  name: string;
  size?: number;
  color?: CategoryColor;
}) {
  const visual = categoryVisuals[name] ?? fallback;
  const colors = color ? colorVariables[color] : visual;
  const Icon = visual.icon;
  return (
    <span
      className={`category-icon category-color-${visual.tone}`}
      style={
        {
          "--category-color": colors.chartColor,
          "--category-ink": colors.inkColor,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <Icon size={size} />
    </span>
  );
}
