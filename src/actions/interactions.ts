"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-types";
import { resolveCategoryId, syncPromptTags } from "@/lib/prompts";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

async function nextOrder(sessionId: string) {
  const last = await prisma.interaction.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

function interactionData(formData: FormData) {
  return {
    prompt: readString(formData, "prompt"),
    response: readString(formData, "response"),
    notes: optional(formData, "notes"),
    generatedCode: optional(formData, "generatedCode"),
    decision: optional(formData, "decision"),
    outcome: optional(formData, "outcome"),
    outcomeStatus: readString(formData, "outcomeStatus") || "PENDING",
    affectedFiles: optional(formData, "affectedFiles"),
    conceptsToStudy: optional(formData, "conceptsToStudy"),
    libraryPromptId: optional(formData, "libraryPromptId"),
  };
}

export async function createInteraction(
  projectId: string,
  sessionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = interactionData(formData);
    if (!data.prompt) {
      return { error: "El prompt de esta iteración es obligatorio." };
    }

    await prisma.interaction.create({
      data: {
        sessionId,
        order: await nextOrder(sessionId),
        ...data,
      },
    });

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath(`/proyectos/${projectId}/sesiones/${sessionId}`);
    revalidatePath("/bitacoras");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo guardar la interacción.",
    };
  }

  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}

export async function updateInteraction(
  projectId: string,
  sessionId: string,
  interactionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = interactionData(formData);
    if (!data.prompt) {
      return { error: "El prompt de esta iteración es obligatorio." };
    }

    await prisma.interaction.update({
      where: { id: interactionId },
      data,
    });

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath(`/proyectos/${projectId}/sesiones/${sessionId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar la interacción.",
    };
  }

  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}

export async function deleteInteraction(
  projectId: string,
  sessionId: string,
  interactionId: string,
) {
  await prisma.interaction.delete({ where: { id: interactionId } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath(`/proyectos/${projectId}/sesiones/${sessionId}`);
  revalidatePath("/bitacoras");
  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}

export async function saveInteractionToLibrary(
  projectId: string,
  sessionId: string,
  interactionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const interaction = await prisma.interaction.findUnique({
      where: { id: interactionId },
    });
    if (!interaction) return { error: "No se encontró la interacción." };

    const title = readString(formData, "title");
    if (!title) return { error: "El título del prompt es obligatorio." };

    const categoryId = await resolveCategoryId(
      readString(formData, "categoryId"),
      readString(formData, "newCategory"),
    );

    const prompt = await prisma.prompt.create({
      data: {
        title,
        content: interaction.prompt,
        description: optional(formData, "description"),
        categoryId,
      },
    });

    await syncPromptTags(prompt.id, readString(formData, "tags"));

    await prisma.interaction.update({
      where: { id: interactionId },
      data: { libraryPromptId: prompt.id },
    });

    revalidatePath("/biblioteca");
    revalidatePath(`/proyectos/${projectId}/sesiones/${sessionId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo guardar en la biblioteca.",
    };
  }

  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}
