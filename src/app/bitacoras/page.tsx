import { PageHeader } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ButtonLink, EmptyState } from "@/components/ui/Form";
import { listProjects } from "@/lib/projects";

export default async function BitacorasPage() {
  const projects = await listProjects();
  const withLog = projects.filter((project) => project._count.sessions > 0);

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title="Bitácoras de uso de IA"
        description="Elegí un trabajo y prepará la entrega en PDF, Markdown o texto. Solo se exporta lo que registraste."
      />
      {withLog.length === 0 ? (
        <EmptyState
          title="Aún no hay bitácoras para exportar"
          description="Creá un proyecto y registrá al menos una sesión de IA. La exportación no inventa contenido."
          action={
            <ButtonLink href="/proyectos" variant="secondary">
              Ir a proyectos
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {withLog.map((project) => (
            <ProjectCard key={project.id} project={project} showExport />
          ))}
        </div>
      )}
    </>
  );
}
