import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { deletePrompt, duplicatePrompt } from "@/actions/prompts";
import { CategoryGlyph } from "@/components/brand/CategoryGlyph";
import { ToolMark } from "@/components/brand/ToolMark";
import { AddToProject } from "@/components/prompts/AddToProject";
import { FavoriteButton } from "@/components/prompts/FavoriteButton";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { CopyButton } from "@/components/ui/CopyButton";
import { NoteBlock } from "@/components/ui/Card";
import { Badge, Button, ButtonLink } from "@/components/ui/Form";
import { formatDateTime } from "@/lib/dates";
import type { PromptWithRelations } from "@/lib/types";

export function PromptDetail({
  prompt,
  backHref,
  projects,
}: {
  prompt: PromptWithRelations;
  backHref: string;
  projects: { id: string; title: string; sessions: { id: string; title: string }[] }[];
}) {
  return (
    <article className="flex h-full w-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1 text-[13px] text-text-secondary lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Biblioteca
          </Link>
          <div className="flex items-start gap-3">
            <CategoryGlyph name={prompt.category.name} />
            <div className="min-w-0">
              <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">
                {prompt.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="muted">{prompt.category.name}</Badge>
                {prompt.tags.map((item) => (
                  <Link key={item.tag.id} href={`/biblioteca?tag=${item.tag.slug}`}>
                    <Badge>{item.tag.name}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <FavoriteButton id={prompt.id} favorite={prompt.favorite} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {prompt.description ? (
          <p className="mb-4 text-[13px] leading-6 text-text-secondary">{prompt.description}</p>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            {prompt.tool ? <ToolMark tool={prompt.tool} /> : null}
            {prompt.tool || "Sin herramienta"}
            {prompt.recommendedModel ? ` · ${prompt.recommendedModel}` : ""}
          </span>
          <span>Editado {formatDateTime(prompt.updatedAt)}</span>
          {prompt.usageContext ? <span>{prompt.usageContext}</span> : null}
        </div>

        <NoteBlock>
          <pre className="font-mono text-[13px] leading-7 text-text-primary">{prompt.content}</pre>
        </NoteBlock>

        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton text={prompt.content} label="Copiar" variant="primary" />
          <ButtonLink href={`/biblioteca/${prompt.id}/editar`} variant="secondary">
            Editar
          </ButtonLink>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AddToProject promptId={prompt.id} projects={projects} />
          <form action={duplicatePrompt.bind(null, prompt.id)}>
            <Button type="submit" variant="ghost">
              Duplicar
            </Button>
          </form>
          <form action={deletePrompt.bind(null, prompt.id)}>
            <ConfirmSubmit
              message="¿Eliminar este prompt de la biblioteca?"
              className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-danger transition-colors duration-[180ms] hover:bg-danger-soft"
            >
              Eliminar
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </article>
  );
}
