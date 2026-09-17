import { notFound } from "next/navigation";
import { deleteSession } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { InteractionTimeline } from "@/components/projects/InteractionTimeline";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { ButtonLink, EmptyState } from "@/components/ui/Form";
import { formatDate } from "@/lib/dates";
import { listCategories, getSession } from "@/lib/projects";

export default async function SesionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const [session, categories] = await Promise.all([
    getSession(sessionId),
    listCategories(),
  ]);
  if (!session || session.projectId !== id) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`${session.project.subject.name} · ${session.project.title}`}
        title={session.title}
        description={`${session.tool}${session.model ? ` · ${session.model}` : ""} · ${formatDate(session.date)}`}
        actions={
          <>
            <ButtonLink href={`/proyectos/${id}/sesiones/${sessionId}/editar`} variant="secondary">
              Editar sesión
            </ButtonLink>
            <ButtonLink href={`/proyectos/${id}/sesiones/${sessionId}/interacciones/nueva`}>
              Nueva iteración
            </ButtonLink>
            <form action={deleteSession.bind(null, id, sessionId)}>
              <ConfirmSubmit
                message="¿Eliminar esta sesión y todas sus iteraciones?"
                className="rounded-md px-3 py-2 text-[13px] text-danger hover:bg-danger-soft"
              >
                Eliminar
              </ConfirmSubmit>
            </form>
          </>
        }
      />

      {session.conversationUrl ? (
        <p className="mb-6 text-[13px]">
          <a
            href={session.conversationUrl}
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Abrir conversación original
          </a>
        </p>
      ) : null}

      {session.observations ? (
        <section className="mb-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-text-primary">Observaciones</h2>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6">{session.observations}</p>
        </section>
      ) : null}

      {session.interactions.length === 0 ? (
        <EmptyState
          title="Sin iteraciones registradas"
          description="Cargá el primer prompt y la respuesta real de esta conversación."
          action={
            <ButtonLink href={`/proyectos/${id}/sesiones/${sessionId}/interacciones/nueva`}>
              Registrar iteración
            </ButtonLink>
          }
        />
      ) : (
        <InteractionTimeline
          projectId={id}
          sessionId={sessionId}
          interactions={session.interactions}
          categories={categories}
        />
      )}
    </>
  );
}
