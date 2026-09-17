import { LibraryWorkspace } from "@/components/prompts/LibraryWorkspace";
import { listCategories, listTags } from "@/lib/projects";
import { listPrompts } from "@/lib/prompts";
import type { PromptSort } from "@/components/prompts/PromptFilters";

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: PromptSort }>;
}) {
  const { q, category, tag, sort } = await searchParams;
  const [prompts, categories, tags] = await Promise.all([
    listPrompts({ q, category, tag, sort }),
    listCategories(),
    listTags(),
  ]);

  return (
    <LibraryWorkspace
      eyebrow="Biblioteca"
      title="Prompts reutilizables"
      description="Guardá, encontrá y copiá los prompts que usás habitualmente."
      newHref="/biblioteca/nuevo"
      newLabel="Nuevo prompt"
      basePath="/biblioteca"
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
