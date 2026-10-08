export const categoryTypes = ["expense", "income", "both"] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const categoryColors = [
  "teal",
  "aqua",
  "blue",
  "amber",
  "coral",
  "green",
] as const;
export type CategoryColor = (typeof categoryColors)[number];

export interface CategoryItem {
  id: string;
  name: string;
  type: CategoryType;
  color: CategoryColor;
  isSystem: boolean;
  archived: boolean;
}

export const categoryTypeLabels: Record<CategoryType, string> = {
  expense: "Despesa",
  income: "Receita",
  both: "Receita e despesa",
};

export const categoryColorLabels: Record<CategoryColor, string> = {
  teal: "Petróleo",
  aqua: "Água",
  blue: "Azul",
  amber: "Âmbar",
  coral: "Coral",
  green: "Verde",
};
