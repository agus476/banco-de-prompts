import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { ExportPanel } from "@/components/projects/ExportPanel";
import { Card } from "@/components/ui/Card";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/Form";
import { projectStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { getProject } from "@/lib/projects";

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const interactions = project.sessions.reduce(
    (sum, session) => sum + session._count.interactions,
    0,
  );
  const tools = [...new Set(project.sessions.map((session) => session.tool))];

  return (
    <>
      <PageHeader
        eyebrow={project.subject.name}
        title={project.title}
        description={project.description ?? undefined}
        actions={
          <>
            <ButtonLink href={`/proyectos/${project.id}/editar`} variant="secondary">
              Editar
            </ButtonLink>
            <form action={deleteProject.bind(null, project.id)}>
              <ConfirmSubmit
                message="¿Eliminar el proyecto y toda su bitácora?"
                className="rounded-md px-3 py-2 text-[13px] text-danger hover:bg-danger-soft"
              >
                Eliminar
              </ConfirmSubmit>
            </form>
          </>
        }
      />

      <ExportPanel projectId={project.id} />

      <section className="mb-8 grid gap-3 sm:grid-cols-4">
        <Stat label="Estado" value={projectStatusLabel(project.status)} />
        <Stat label="Fecha" value={project.date ? formatDate(project.date) : "Sin fecha"} />
        <Stat label="Sesiones" value={String(project.sessions.length)} />
        <Stat label="Prompts registrados" value={String(interactions)} />
      </section>

      <dl className="mb-8 grid gap-4 text-[13px] text-text-secondary sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase">Institución</dt>
          <dd className="mt-1 text-text-primary">{project.institution || "Sin registrar"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase">Docente</dt>
          <dd className="mt-1 text-text-primary">{project.teacher || "Sin registrar"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase">Herramientas</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {tools.length === 0
              ? "Todavía ninguna"
              : tools.map((tool) => (
                  <Badge key={tool}>{tool}</Badge>
                ))}
          </dd>
        </div>
      </dl>

      {project.notes ? (
        <Card padded className="mb-8">
          <h2 className="text-[13px] font-medium text-text-primary">Notas</h2>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-text-primary">
            {project.notes}
          </p>
        </Card>
      ) : null}

      {project.conclusions ? (
        <Card padded className="mb-8">
          <h2 className="text-[13px] font-medium text-text-primary">Conclusiones del proceso</h2>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-text-primary">
            {project.conclusions}
          </p>
        </Card>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">Sesiones de IA</h2>
        <ButtonLink href={`/proyectos/${project.id}/sesiones/nueva`}>Nueva sesión</ButtonLink>
      </div>

      {project.sessions.length === 0 ? (
        <EmptyState
          title="Esta bitácora todavía está vacía"
          description="Registrá una conversación real. La aplicación no inventa prompts ni respuestas."
          action={
            <ButtonLink href={`/proyectos/${project.id}/sesiones/nueva`}>
              Registrar sesión
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-2">
          {project.sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/proyectos/${project.id}/sesiones/${session.id}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors duration-[180ms] hover:bg-surface-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-medium text-text-primary">{session.title}</h3>
                    <p className="mt-1 text-[13px] text-text-secondary">
                      {session.tool}
                      {session.model ? ` · ${session.model}` : ""} · {formatDate(session.date)}
                    </p>
                  </div>
                  <Badge>
                    {session._count.interactions} iteración
                    {session._count.interactions === 1 ? "" : "es"}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-text-primary">{value}</p>
    </Card>
  );
}
