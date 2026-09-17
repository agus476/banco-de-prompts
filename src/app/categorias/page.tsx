import Link from "next/link";
import { createCategory, deleteCategory } from "@/actions/prompts";
import { CategoryCreateForm } from "@/app/categorias/CategoryCreateForm";
import { CategoryGlyph } from "@/components/brand/CategoryGlyph";
import { PageHeader } from "@/components/layout/AppShell";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { EmptyState } from "@/components/ui/Form";
import { listCategories } from "@/lib/projects";

export default async function CategoriasPage() {
  const categories = await listCategories();

  return (
    <>
      <PageHeader
        eyebrow="Biblioteca"
        title="Categorías"
        description="Agrupan los prompts reutilizables. No se pueden borrar si todavía tienen prompts."
      />
      <CategoryCreateForm action={createCategory} />
      {categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Creá la primera para organizar la biblioteca."
        />
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <Link
                href={`/biblioteca?category=${category.slug}`}
                className="flex min-w-0 items-center gap-3"
              >
                <CategoryGlyph name={category.name} />
                <span>
                  <span className="block font-medium text-text-primary">{category.name}</span>
                  <span className="text-[13px] text-text-secondary">
                    {category._count.prompts} prompt{category._count.prompts === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
              {category._count.prompts === 0 ? (
                <form action={deleteCategory.bind(null, category.id)}>
                  <ConfirmSubmit
                    message="¿Eliminar esta categoría?"
                    className="text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </ConfirmSubmit>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
