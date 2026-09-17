import { createPrompt } from "@/actions/prompts";
import { LibraryWorkspace } from "@/components/prompts/LibraryWorkspace";
import { PromptForm } from "@/components/prompts/PromptForm";
import { listCategories, listTags } from "@/lib/projects";
import { listPrompts } from "@/lib/prompts";
import type { PromptSort } from "@/components/prompts/PromptFilters";

export default async function NuevoPromptPage({
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
      basePath="/biblioteca/nuevo"
      prompts={prompts}
      showPanel
      q={q}
      category={category}
      tag={tag}
      sort={sort}
      categories={categories}
      tags={tags}
      detail={
        <div className="w-full overflow-y-auto p-5">
          <h2 className="mb-4 text-[17px] font-semibold tracking-tight">Nuevo prompt</h2>
          <PromptForm categories={categories} action={createPrompt} />
        </div>
      }
    />
  );
}
