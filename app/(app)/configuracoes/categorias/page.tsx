import { CategoryManager } from "@/components/finance/category-manager";
import { PageHeader } from "@/components/finance/page-header";
import { listCategories } from "@/lib/queries/finance";

export const metadata = { title: "Categorias e tags" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const [{ editar }, categories] = await Promise.all([
    searchParams,
    listCategories(),
  ]);

  return (
    <div className="page narrow-page categories-page">
      <PageHeader
        title="Categorias"
        description="Organize lançamentos e orçamento com nomes e cores consistentes."
        month={false}
      />
      <CategoryManager initialItems={categories} editName={editar} />
      <p className="context-note">
        Categorias usadas são arquivadas, não apagadas. Assim, o histórico
        financeiro continua íntegro.
      </p>
    </div>
  );
}
