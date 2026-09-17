import { LibraryWorkspace } from "@/components/prompts/LibraryWorkspace";
import { listCategories, listTags } from "@/lib/projects";
import { listPrompts } from "@/lib/prompts";
import type { PromptSort } from "@/components/prompts/PromptFilters";

export default async function FavoritosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: PromptSort }>;
}) {
  const { q, category, tag, sort } = await searchParams;
  const [prompts, categories, tags] = await Promise.all([
    listPrompts({ favorite: true, q, category, tag, sort }),
    listCategories(),
    listTags(),
  ]);

  return (
    <LibraryWorkspace
      eyebrow="Favoritos"
      title="Los que usás seguido"
      description="Los prompts que marcaste para reutilizar más rápido."
      newHref="/biblioteca/nuevo"
      newLabel="Nuevo prompt"
      basePath="/favoritos"
      prompts={prompts}
      q={q}
      category={category}
      tag={tag}
      sort={sort}
      categories={categories}
      tags={tags}
    />
  );
}
