"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-types";
import { parseDateInput } from "@/lib/dates";
import { resolveSubjectId } from "@/lib/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value.length > 0 ? value : null;
}

export async function createProject(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let projectId = "";
  try {
    const title = readString(formData, "title");
    if (!title) return { error: "El título del trabajo es obligatorio." };

    const subjectId = await resolveSubjectId(
      readString(formData, "subjectId"),
      readString(formData, "newSubject"),
    );

    const project = await prisma.project.create({
      data: {
        title,
        subjectId,
        description: optional(formData, "description"),
        date: parseDateInput(readString(formData, "date")),
        institution: optional(formData, "institution"),
        teacher: optional(formData, "teacher"),
        status: readString(formData, "status") || "IN_PROGRESS",
        notes: optional(formData, "notes"),
        conclusions: optional(formData, "conclusions"),
      },
    });

    projectId = project.id;
    revalidatePath("/proyectos");
    revalidatePath("/bitacoras");
    revalidatePath("/materias");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear el proyecto.",
    };
  }

  redirect(`/proyectos/${projectId}`);
}

export async function updateProject(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const title = readString(formData, "title");
    if (!title) return { error: "El título del trabajo es obligatorio." };

    const subjectId = await resolveSubjectId(
      readString(formData, "subjectId"),
      readString(formData, "newSubject"),
    );

    await prisma.project.update({
      where: { id },
      data: {
        title,
        subjectId,
        description: optional(formData, "description"),
        date: parseDateInput(readString(formData, "date")),
        institution: optional(formData, "institution"),
        teacher: optional(formData, "teacher"),
        status: readString(formData, "status") || "IN_PROGRESS",
        notes: optional(formData, "notes"),
        conclusions: optional(formData, "conclusions"),
      },
    });

    revalidatePath("/proyectos");
    revalidatePath("/bitacoras");
    revalidatePath(`/proyectos/${id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar el proyecto.",
    };
  }

  redirect(`/proyectos/${id}`);
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/proyectos");
  revalidatePath("/bitacoras");
  revalidatePath("/materias");
  redirect("/proyectos");
}

export async function createSession(
  projectId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let sessionId = "";
  try {
    const title = readString(formData, "title");
    const tool = readString(formData, "tool");
    if (!title || !tool) {
      return { error: "El título y la herramienta son obligatorios." };
    }

    const session = await prisma.session.create({
      data: {
        projectId,
        title,
        tool,
        model: optional(formData, "model"),
        date: parseDateInput(readString(formData, "date")) ?? new Date(),
        conversationUrl: optional(formData, "conversationUrl"),
        observations: optional(formData, "observations"),
      },
    });

    sessionId = session.id;
    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath("/bitacoras");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la sesión.",
    };
  }

  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}

export async function updateSession(
  projectId: string,
  sessionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const title = readString(formData, "title");
    const tool = readString(formData, "tool");
    if (!title || !tool) {
      return { error: "El título y la herramienta son obligatorios." };
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        title,
        tool,
        model: optional(formData, "model"),
        date: parseDateInput(readString(formData, "date")) ?? new Date(),
        conversationUrl: optional(formData, "conversationUrl"),
        observations: optional(formData, "observations"),
      },
    });

    revalidatePath(`/proyectos/${projectId}`);
    revalidatePath(`/proyectos/${projectId}/sesiones/${sessionId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar la sesión.",
    };
  }

  redirect(`/proyectos/${projectId}/sesiones/${sessionId}`);
}

export async function deleteSession(projectId: string, sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/bitacoras");
  redirect(`/proyectos/${projectId}`);
}
