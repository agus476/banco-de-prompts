import { notFound } from "next/navigation";
import { createSession } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { SessionForm } from "@/components/projects/SessionForm";
import { getProject } from "@/lib/projects";

export default async function NuevaSesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        eyebrow={project.title}
        title="Nueva sesión de IA"
        description="Una sesión representa una conversación real. Completala con lo que efectivamente ocurrió."
      />
      <SessionForm action={createSession.bind(null, project.id)} />
    </>
  );
}
