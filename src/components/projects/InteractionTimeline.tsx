import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { deleteInteraction } from "@/actions/interactions";
import { SaveToLibraryForm } from "@/components/projects/SaveToLibraryForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { CopyButton } from "@/components/ui/CopyButton";
import { Badge, ButtonLink } from "@/components/ui/Form";
import { outcomeStatusLabel } from "@/lib/constants";
import type { InteractionWithLibrary } from "@/lib/types";

function Block({
  title,
  children,
  copyText,
}: {
  title: string;
  children: ReactNode;
  copyText?: string;
}) {
  return (
    <section className="rounded-lg bg-background p-4 shadow-[inset_0_0_0_1px_var(--border)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">{title}</h3>
        {copyText ? <CopyButton text={copyText} compact /> : null}
      </div>
      <div className="whitespace-pre-wrap text-[13px] leading-6 text-text-primary">{children}</div>
    </section>
  );
}

export function InteractionTimeline({
  projectId,
  sessionId,
  interactions,
  categories,
}: {
  projectId: string;
  sessionId: string;
  interactions: InteractionWithLibrary[];
  categories: { id: string; name: string }[];
}) {
  return (
    <ol className="space-y-8">
      {interactions.map((interaction, index) => (
        <li key={interaction.id} className="relative pl-6">
          <span className="absolute top-1 left-0 flex h-5 w-5 items-center justify-center rounded-full bg-surface-hover text-[11px] font-medium text-text-secondary">
            {interaction.order}
          </span>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-text-primary">Iteración {interaction.order}</p>
              {interaction.outcomeStatus !== "PENDING" ? (
                <Badge tone="accent">{outcomeStatusLabel(interaction.outcomeStatus)}</Badge>
              ) : null}
              {interaction.libraryPrompt ? (
                <Link
                  href={`/biblioteca/${interaction.libraryPrompt.id}`}
                  className="text-[12px] text-text-secondary hover:underline"
                >
                  En biblioteca: {interaction.libraryPrompt.title}
                </Link>
              ) : null}
            </div>

            <Block title="Prompt" copyText={interaction.prompt}>
              <pre className="font-mono text-[13px]">{interaction.prompt}</pre>
            </Block>
            <div className="flex justify-center text-text-secondary">
              <ArrowDown className="h-4 w-4" />
            </div>
            <Block title="Respuesta IA" copyText={interaction.response || undefined}>
              {interaction.response.trim() ? (
                <pre className="font-mono text-[13px]">{interaction.response}</pre>
              ) : (
                <p className="text-text-secondary italic">Sin respuesta registrada</p>
              )}
            </Block>

            {interaction.outcome ? (
              <>
                <div className="flex justify-center text-text-secondary">
                  <ArrowDown className="h-4 w-4" />
                </div>
                <Block title="Resultado">{interaction.outcome}</Block>
              </>
            ) : null}

            {interaction.decision ? (
              <>
                <div className="flex justify-center text-text-secondary">
                  <ArrowDown className="h-4 w-4" />
                </div>
                <Block title="Decisión tomada">{interaction.decision}</Block>
              </>
            ) : null}

            {interaction.generatedCode ? (
              <Block title="Código generado" copyText={interaction.generatedCode}>
                <pre className="font-mono text-[13px]">{interaction.generatedCode}</pre>
              </Block>
            ) : null}

            {interaction.notes ? <Block title="Notas">{interaction.notes}</Block> : null}

            {interaction.affectedFiles ? (
              <p className="text-[12px] text-text-secondary">Archivos afectados: {interaction.affectedFiles}</p>
            ) : null}
            {interaction.conceptsToStudy ? (
              <p className="text-[12px] text-text-secondary">
                Conceptos a estudiar: {interaction.conceptsToStudy}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <ButtonLink
                href={`/proyectos/${projectId}/sesiones/${sessionId}/interacciones/${interaction.id}/editar`}
                variant="secondary"
              >
                Editar
              </ButtonLink>
              {!interaction.libraryPromptId ? (
                <SaveToLibraryForm
                  projectId={projectId}
                  sessionId={sessionId}
                  interactionId={interaction.id}
                  defaultTitle={`Prompt de iteración ${interaction.order}`}
                  categories={categories}
                />
              ) : null}
              <form action={deleteInteraction.bind(null, projectId, sessionId, interaction.id)}>
                <ConfirmSubmit
                  message="¿Eliminar esta iteración de la bitácora?"
                  className="rounded-md px-3 py-2 text-sm text-danger hover:bg-danger-soft"
                >
                  Eliminar
                </ConfirmSubmit>
              </form>
            </div>
          </div>
          {index < interactions.length - 1 ? (
            <div className="mt-6 h-px bg-border" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
