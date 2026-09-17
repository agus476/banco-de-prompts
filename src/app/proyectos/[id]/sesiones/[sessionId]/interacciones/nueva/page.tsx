import { notFound } from "next/navigation";
import { createInteraction } from "@/actions/interactions";
import { PageHeader } from "@/components/layout/AppShell";
import { InteractionForm } from "@/components/projects/InteractionForm";
import { getSession } from "@/lib/projects";
import { listPromptOptions } from "@/lib/prompts";

export default async function NuevaInteraccionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const [session, libraryPrompts] = await Promise.all([
    getSession(sessionId),
    listPromptOptions(),
  ]);
  if (!session || session.projectId !== id) notFound();

  return (
    <>
      <PageHeader
        eyebrow={session.title}
        title="Nueva iteración"
        description="Registrá exactamente qué preguntaste y qué respondió la IA. No completes huecos con suposiciones."
      />
      <InteractionForm
        libraryPrompts={libraryPrompts}
        action={createInteraction.bind(null, id, sessionId)}
      />
    </>
  );
}
