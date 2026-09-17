import { notFound } from "next/navigation";
import { updateInteraction } from "@/actions/interactions";
import { PageHeader } from "@/components/layout/AppShell";
import { InteractionForm } from "@/components/projects/InteractionForm";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/projects";
import { listPromptOptions } from "@/lib/prompts";

export default async function EditarInteraccionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string; interactionId: string }>;
}) {
  const { id, sessionId, interactionId } = await params;
  const [session, interaction, libraryPrompts] = await Promise.all([
    getSession(sessionId),
    prisma.interaction.findUnique({ where: { id: interactionId } }),
    listPromptOptions(),
  ]);

  if (!session || session.projectId !== id || !interaction || interaction.sessionId !== sessionId) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={session.title}
        title={`Editar iteración ${interaction.order}`}
      />
      <InteractionForm
        libraryPrompts={libraryPrompts}
        interaction={interaction}
        action={updateInteraction.bind(null, id, sessionId, interactionId)}
      />
    </>
  );
}
