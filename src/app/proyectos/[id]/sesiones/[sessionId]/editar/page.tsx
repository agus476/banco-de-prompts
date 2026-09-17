import { notFound } from "next/navigation";
import { updateSession } from "@/actions/projects";
import { PageHeader } from "@/components/layout/AppShell";
import { SessionForm } from "@/components/projects/SessionForm";
import { getSession } from "@/lib/projects";

export default async function EditarSesionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session || session.projectId !== id) notFound();

  return (
    <>
      <PageHeader eyebrow={session.project.title} title={`Editar: ${session.title}`} />
      <SessionForm
        session={session}
        action={updateSession.bind(null, id, sessionId)}
      />
    </>
  );
}
