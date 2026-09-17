import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { LogbookProject } from "@/lib/types";

export async function listProjects(subjectSlug?: string) {
  return prisma.project.findMany({
    where: subjectSlug ? { subject: { slug: subjectSlug } } : undefined,
    include: {
      subject: true,
      _count: { select: { sessions: true } },
      sessions: {
        select: {
          tool: true,
          _count: { select: { interactions: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listProjectPicker() {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      sessions: {
        select: { id: true, title: true },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      subject: true,
      sessions: {
        include: {
          _count: { select: { interactions: true } },
        },
        orderBy: { date: "asc" },
      },
    },
  });
}

export async function getProjectLogbook(id: string): Promise<LogbookProject | null> {
  return prisma.project.findUnique({
    where: { id },
    include: {
      subject: true,
      sessions: {
        include: {
          interactions: { orderBy: { order: "asc" } },
        },
        orderBy: { date: "asc" },
      },
    },
  });
}

export async function uniqueSubjectSlug(name: string) {
  return uniqueSlug(name, async (slug) => {
    const found = await prisma.subject.findUnique({ where: { slug } });
    return Boolean(found);
  });
}

export async function resolveSubjectId(subjectId: string, newSubject: string) {
  const name = newSubject.trim();
  if (name) {
    const existing = await prisma.subject.findUnique({
      where: { slug: slugify(name) },
    });
    if (existing) return existing.id;
    const created = await prisma.subject.create({
      data: { name, slug: await uniqueSubjectSlug(name) },
    });
    return created.id;
  }
  if (!subjectId) {
    throw new Error("Elegí una materia o creá una nueva.");
  }
  return subjectId;
}

export async function listSubjects() {
  return prisma.subject.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSubjectBySlug(slug: string) {
  return prisma.subject.findUnique({
    where: { slug },
    include: {
      projects: {
        include: {
          subject: true,
          _count: { select: { sessions: true } },
          sessions: {
            select: {
              tool: true,
              _count: { select: { interactions: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { prompts: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listTags() {
  return prisma.tag.findMany({
    include: { _count: { select: { prompts: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      project: { include: { subject: true } },
      interactions: {
        include: { libraryPrompt: true },
        orderBy: { order: "asc" },
      },
    },
  });
}
