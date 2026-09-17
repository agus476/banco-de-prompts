import { notFound } from "next/navigation";
import { LibraryWorkspace } from "@/components/prompts/LibraryWorkspace";
import { PromptDetail } from "@/components/prompts/PromptDetail";
import { listCategories, listProjectPicker, listTags } from "@/lib/projects";
import { getPrompt, listPrompts } from "@/lib/prompts";
import type { PromptSort } from "@/components/prompts/PromptFilters";

export default async function PromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; category?: string; tag?: string; sort?: PromptSort }>;
}) {
  const { id } = await params;
  const { q, category, tag, sort } = await searchParams;
  const [prompt, prompts, categories, tags, projects] = await Promise.all([
    getPrompt(id),
    listPrompts({ q, category, tag, sort }),
    listCategories(),
    listTags(),
    listProjectPicker(),
  ]);
  if (!prompt) notFound();

  return (
    <LibraryWorkspace
      eyebrow="Biblioteca"
      title="Prompts reutilizables"
      description="Guardá, encontrá y copiá los prompts que usás habitualmente."
      newHref="/biblioteca/nuevo"
      newLabel="Nuevo prompt"
      basePath={`/biblioteca/${id}`}
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
        <PromptDetail prompt={prompt} backHref="/biblioteca" projects={projects} />
      }
    />
  );
}
