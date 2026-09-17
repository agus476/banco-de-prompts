import { createProject } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { listSubjects } from "@/lib/projects";

export default async function NuevoProyectoPage() {
  const subjects = await listSubjects();

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title="Nuevo proyecto"
        description="Un espacio por trabajo práctico. La evidencia de IA se carga después, a mano."
      />
      <ProjectForm subjects={subjects} action={createProject} />
    </>
  );
}
