import type { ReactNode } from "react";
import { Plus } from "lucide-react";
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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className={cn(
          "border-b border-border px-5 pt-5 pb-4 pl-16 lg:pt-6 lg:pl-5",
          showPanel && "hidden lg:block",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-text-secondary uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-text-primary">
              {title}
            </h1>
            <p className="mt-1 max-w-xl text-[13px] leading-5 text-text-secondary">
              {description}
            </p>
          </div>
          <ButtonLink href={newHref} className="mt-1 shrink-0">
            <Plus className="h-4 w-4" />
            {newLabel}
          </ButtonLink>
        </div>
      </header>

      <div className={cn("border-b border-border pt-3", showPanel && "hidden lg:block")}>
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
            "min-h-0 w-full overflow-y-auto px-3 py-3 lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border xl:w-[420px]",
            showPanel && "hidden lg:block",
          )}
          aria-label="Lista de prompts"
        >
          {prompts.length === 0 ? (
            <EmptyState
              title="Todavía no hay prompts"
              description="Creá el primero para dejar de buscarlo entre chats y archivos."
              action={<ButtonLink href={newHref}>{newLabel}</ButtonLink>}
            />
          ) : (
            <div className="space-y-0.5">
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
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <p className="max-w-xs text-[13px] leading-6 text-text-secondary">
                Seleccioná un prompt para leerlo, copiarlo o editarlo.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
