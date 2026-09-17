import { PageHeader } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ButtonLink, EmptyState } from "@/components/ui/Form";
import { listProjects } from "@/lib/projects";

export default async function ProyectosPage() {
  const projects = await listProjects();

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title="Proyectos académicos"
        description="Cada proyecto es un trabajo práctico. Las sesiones de IA viven adentro."
        actions={<ButtonLink href="/proyectos/nuevo">Nuevo proyecto</ButtonLink>}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="Todavía no hay proyectos"
          description="Creá un trabajo práctico para empezar a documentar el proceso con IA."
          action={<ButtonLink href="/proyectos/nuevo">Crear proyecto</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
