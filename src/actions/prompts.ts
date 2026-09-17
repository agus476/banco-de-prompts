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

export async function createPrompt(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let promptId = "";
  try {
    const title = readString(formData, "title");
    const content = readString(formData, "content");
    if (!title || !content) {
      return { error: "El título y el contenido son obligatorios." };
    }

    const categoryId = await resolveCategoryId(
      readString(formData, "categoryId"),
      readString(formData, "newCategory"),
    );

    const prompt = await prisma.prompt.create({
      data: {
        title,
        content,
        description: optional(formData, "description"),
        tool: optional(formData, "tool"),
        recommendedModel: optional(formData, "recommendedModel"),
        usageContext: optional(formData, "usageContext"),
        favorite: formData.get("favorite") === "on",
        categoryId,
      },
    });

    promptId = prompt.id;
    await syncPromptTags(prompt.id, readString(formData, "tags"));
    revalidatePath("/biblioteca");
    revalidatePath("/categorias");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo guardar el prompt.",
    };
  }

  redirect(`/biblioteca/${promptId}`);
}

export async function updatePrompt(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const title = readString(formData, "title");
    const content = readString(formData, "content");
    if (!title || !content) {
      return { error: "El título y el contenido son obligatorios." };
    }

    const categoryId = await resolveCategoryId(
      readString(formData, "categoryId"),
      readString(formData, "newCategory"),
    );

    await prisma.prompt.update({
      where: { id },
      data: {
        title,
        content,
        description: optional(formData, "description"),
        tool: optional(formData, "tool"),
        recommendedModel: optional(formData, "recommendedModel"),
        usageContext: optional(formData, "usageContext"),
        favorite: formData.get("favorite") === "on",
        categoryId,
      },
    });

    await syncPromptTags(id, readString(formData, "tags"));
    revalidatePath("/biblioteca");
    revalidatePath(`/biblioteca/${id}`);
    revalidatePath("/categorias");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar el prompt.",
    };
  }

  redirect(`/biblioteca/${id}`);
}

export async function deletePrompt(id: string) {
  await prisma.prompt.delete({ where: { id } });
  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  redirect("/biblioteca");
}

export async function toggleFavorite(id: string) {
  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) return;
  await prisma.prompt.update({
    where: { id },
    data: { favorite: !prompt.favorite },
  });
  revalidatePath("/biblioteca");
  revalidatePath("/favoritos");
  revalidatePath(`/biblioteca/${id}`);
}

export async function duplicatePrompt(id: string) {
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
  if (!prompt) return;

  const copy = await prisma.prompt.create({
    data: {
      title: `${prompt.title} (copia)`,
      content: prompt.content,
      description: prompt.description,
      tool: prompt.tool,
      recommendedModel: prompt.recommendedModel,
      usageContext: prompt.usageContext,
      favorite: false,
      categoryId: prompt.categoryId,
    },
  });

  await syncPromptTags(
    copy.id,
    prompt.tags.map((item) => item.tag.name).join(", "),
  );
  revalidatePath("/biblioteca");
  redirect(`/biblioteca/${copy.id}/editar`);
}

export async function addPromptToSession(promptId: string, formData: FormData) {
  const sessionId = readString(formData, "sessionId");
  if (!sessionId) return;

  const [prompt, session] = await Promise.all([
    prisma.prompt.findUnique({ where: { id: promptId } }),
    prisma.session.findUnique({ where: { id: sessionId } }),
  ]);
  if (!prompt || !session) return;

  const last = await prisma.interaction.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.interaction.create({
    data: {
      sessionId,
      order: (last?.order ?? 0) + 1,
      prompt: prompt.content,
      libraryPromptId: prompt.id,
      response: "",
    },
  });

  revalidatePath(`/proyectos/${session.projectId}`);
  redirect(`/proyectos/${session.projectId}/sesiones/${sessionId}`);
}

export async function createCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = readString(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  try {
    const { uniqueCategorySlug } = await import("@/lib/prompts");
    const slug = await uniqueCategorySlug(name);
    await prisma.category.create({ data: { name, slug } });
    revalidatePath("/categorias");
    revalidatePath("/biblioteca");
    return null;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la categoría.",
    };
  }
}

export async function deleteCategory(id: string) {
  const count = await prisma.prompt.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error("No se puede eliminar una categoría que todavía tiene prompts.");
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}

export async function createSubject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = readString(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  try {
    const { uniqueSubjectSlug } = await import("@/lib/projects");
    const slug = await uniqueSubjectSlug(name);
    await prisma.subject.create({ data: { name, slug } });
    revalidatePath("/materias");
    revalidatePath("/proyectos");
    return null;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la materia.",
    };
  }
}

export async function deleteSubject(id: string) {
  const count = await prisma.project.count({ where: { subjectId: id } });
  if (count > 0) {
    throw new Error("No se puede eliminar una materia que todavía tiene proyectos.");
  }
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/materias");
}
