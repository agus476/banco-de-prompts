import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/AppShell";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ButtonLink, EmptyState } from "@/components/ui/Form";
import { getSubjectBySlug } from "@/lib/projects";

export default async function MateriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Materia"
        title={subject.name}
        actions={<ButtonLink href="/proyectos/nuevo">Nuevo proyecto</ButtonLink>}
      />
      {subject.projects.length === 0 ? (
        <EmptyState
          title="Esta materia no tiene trabajos todavía"
          description="Creá un proyecto para empezar a registrar la bitácora."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subject.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
