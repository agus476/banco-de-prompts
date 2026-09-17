import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, Plus } from "lucide-react";
import { PromptCard } from "@/components/prompts/PromptCard";
import { PromptFilters, type PromptSort } from "@/components/prompts/PromptFilters";
import { ButtonLink, EmptyState } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import type { PromptWithRelations } from "@/lib/types";

export function LibraryWorkspace({
  eyebrow,
  title,
  description,
  newHref,
  newLabel,
  basePath,
  prompts,
  selectedId,
  showPanel = false,
  q,
  category,
  tag,
  sort,
  categories,
  tags,
  detail,
}: {
  eyebrow: string;
  title: string;
  description: string;
  newHref: string;
  newLabel: string;
  basePath: string;
  prompts: PromptWithRelations[];
  selectedId?: string;
  showPanel?: boolean;
  q?: string;
  category?: string;
  tag?: string;
  sort?: PromptSort;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  detail?: ReactNode;
}) {
  const filtered = Boolean(q || category || tag);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={cn(
          "border-b border-border bg-surface px-5 py-6 lg:px-7 lg:py-7",
          showPanel && "hidden lg:block",
        )}
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary lg:text-[28px]">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-text-secondary">
              {description}
            </p>
          </div>
          <ButtonLink href={newHref} className="shrink-0 shadow-card sm:mt-1">
            <Plus className="h-4 w-4" aria-hidden />
            {newLabel}
          </ButtonLink>
        </div>
      </header>

      <div className={cn("border-b border-border bg-surface pt-4", showPanel && "hidden lg:block")}>
        <PromptFilters
          basePath={basePath}
          q={q}
          category={category}
          tag={tag}
          sort={sort}
          categories={categories}
          tags={tags}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <section
          className={cn(
            "min-h-0 w-full overflow-y-auto px-4 pt-4 pb-6 lg:w-[360px] lg:shrink-0 lg:border-r lg:border-border xl:w-[400px]",
            showPanel && "hidden lg:block",
          )}
          aria-label="Lista de prompts"
        >
          <div className="mb-3 flex items-center justify-between px-1 text-[11px] text-text-secondary" role="status">
            <span className="font-medium">{filtered ? "Resultados" : "Tu colección"}</span>
            <span className="tabular-nums">{prompts.length} {prompts.length === 1 ? "prompt" : "prompts"}</span>
          </div>
          {prompts.length === 0 ? (
            <EmptyState
              title={filtered ? "No encontramos coincidencias" : "Tu próxima buena idea empieza acá"}
              description={filtered ? "Probá otra búsqueda o quitá los filtros para ver más prompts." : "Guardá tu primer prompt y tenelo a mano cuando lo necesites."}
              action={!filtered ? <ButtonLink href={newHref}>{newLabel}</ButtonLink> : undefined}
            />
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  href={`/biblioteca/${prompt.id}`}
                  selected={prompt.id === selectedId}
                />
              ))}
            </div>
          )}
        </section>

        <section
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-y-auto bg-surface",
            showPanel ? "flex" : "hidden lg:flex",
          )}
          aria-label="Detalle"
        >
          {detail ?? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/15 bg-accent-soft text-accent">
                <BookOpen className="h-7 w-7" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-text-secondary uppercase">Menos buscar. Más crear.</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-text-primary">Tus mejores prompts, a mano</h2>
              <p className="mt-3 max-w-xs text-[13px] leading-6 text-text-secondary">
                Seleccioná uno de tu colección para leerlo, copiarlo o seguir mejorándolo.
              </p>
              <div className="mt-7">
                <ButtonLink href={newHref} variant="secondary">
                  {newLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </ButtonLink>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
