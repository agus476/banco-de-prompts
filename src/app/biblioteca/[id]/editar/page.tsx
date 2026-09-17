import { notFound } from "next/navigation";
import { updatePrompt } from "@/actions/prompts";
import { LibraryWorkspace } from "@/components/prompts/LibraryWorkspace";
import { PromptForm } from "@/components/prompts/PromptForm";
import { listCategories, listTags } from "@/lib/projects";
import { getPrompt, listPrompts } from "@/lib/prompts";
import type { PromptSort } from "@/components/prompts/PromptFilters";

export default async function EditarPromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: PromptSort }>;
}) {
  const { id } = await params;
  const { q, category, tag, sort } = await searchParams;
  const [prompt, prompts, categories, tags] = await Promise.all([
    getPrompt(id),
    listPrompts({ q, category, tag, sort }),
    listCategories(),
    listTags(),
  ]);
  if (!prompt) notFound();

  return (
    <LibraryWorkspace
      eyebrow="Biblioteca"
      title="Prompts reutilizables"
      description="Guardá, encontrá y copiá los prompts que usás habitualmente."
      newHref="/biblioteca/nuevo"
      newLabel="Nuevo prompt"
      basePath={`/biblioteca/${id}/editar`}
      prompts={prompts}
      selectedId={id}
      showPanel
      q={q}
      category={category}
      tag={tag}
      sort={sort}
      categories={categories}
      tags={tags}
      detail={
        <div className="w-full overflow-y-auto p-5">
          <h2 className="mb-4 text-[17px] font-semibold tracking-tight">Editar prompt</h2>
          <PromptForm
            categories={categories}
            prompt={prompt}
            action={updatePrompt.bind(null, prompt.id)}
          />
        </div>
      }
    />
  );
}
