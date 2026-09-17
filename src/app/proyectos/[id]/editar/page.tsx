import { notFound } from "next/navigation";
import { updateProject } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getProject, listSubjects } from "@/lib/projects";

export default async function EditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, subjects] = await Promise.all([getProject(id), listSubjects()]);
  if (!project) notFound();

  return (
    <>
      <PageHeader eyebrow="Proyecto" title={`Editar: ${project.title}`} />
      <ProjectForm
        subjects={subjects}
        project={project}
        action={updateProject.bind(null, project.id)}
      />
    </>
  );
}
