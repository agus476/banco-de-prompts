import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { PromptWithRelations } from "@/lib/types";

export type PromptFilters = {
  q?: string;
  category?: string;
  tag?: string;
  favorite?: boolean;
  sort?: "recent" | "title" | "created";
};

export async function listPrompts(
  filters: PromptFilters = {},
): Promise<PromptWithRelations[]> {
  const q = filters.q?.trim();
  const sort = filters.sort ?? "recent";

  return prisma.prompt.findMany({
    where: {
      favorite: filters.favorite ? true : undefined,
      category: filters.category ? { slug: filters.category } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
      OR: q
        ? [
            { title: { contains: q } },
            { description: { contains: q } },
            { content: { contains: q } },
            { usageContext: { contains: q } },
          ]
        : undefined,
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy:
      sort === "title"
        ? { title: "asc" }
        : sort === "created"
          ? { createdAt: "desc" }
          : { updatedAt: "desc" },
  });
}

export async function getPrompt(id: string) {
  return prisma.prompt.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

export async function listPromptOptions() {
  return prisma.prompt.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { title: "asc" },
  });
}

export async function uniqueCategorySlug(name: string) {
  return uniqueSlug(name, async (slug) => {
    const found = await prisma.category.findUnique({ where: { slug } });
    return Boolean(found);
  });
}

export async function uniqueTagSlug(name: string) {
  return uniqueSlug(name, async (slug) => {
    const found = await prisma.tag.findUnique({ where: { slug } });
    return Boolean(found);
  });
}

export async function resolveCategoryId(categoryId: string, newCategory: string) {
  const name = newCategory.trim();
  if (name) {
    const existing = await prisma.category.findUnique({
      where: { slug: slugify(name) },
    });
    if (existing) return existing.id;
    const created = await prisma.category.create({
      data: { name, slug: await uniqueCategorySlug(name) },
    });
    return created.id;
  }
  if (!categoryId) {
    throw new Error("Elegí una categoría o creá una nueva.");
  }
  return categoryId;
}

export async function syncPromptTags(promptId: string, rawTags: string) {
  const names = rawTags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];

  await prisma.promptTag.deleteMany({ where: { promptId } });

  for (const name of uniqueNames) {
    const existing = await prisma.tag.findUnique({ where: { slug: slugify(name) } });
    const tag =
      existing ??
      (await prisma.tag.create({
        data: { name, slug: await uniqueTagSlug(name) },
      }));

    await prisma.promptTag.create({
      data: { promptId, tagId: tag.id },
    });
  }
}
