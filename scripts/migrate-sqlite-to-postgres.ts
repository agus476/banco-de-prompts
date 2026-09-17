import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const source = "prisma/dev.db.backup";

function rows<T>(table: string): T[] {
  const output = execFileSync("sqlite3", ["-json", source, `SELECT * FROM ${table};`], {
    encoding: "utf8",
  });
  return output.trim() ? JSON.parse(output) : [];
}

function dates<T extends Record<string, unknown>>(row: T) {
  const result = { ...row } as Record<string, unknown>;
  for (const key of ["createdAt", "updatedAt", "date"]) {
    if (typeof result[key] === "string" || typeof result[key] === "number") {
      result[key] = new Date(result[key]);
    }
  }
  return result;
}

async function main() {
  const categories = rows<Record<string, unknown>>("Category").map(dates);
  const tags = rows<Record<string, unknown>>("Tag").map(dates);
  const subjects = rows<Record<string, unknown>>("Subject").map(dates);
  const prompts = rows<Record<string, unknown>>("Prompt").map((row) => dates({ ...row, favorite: Boolean(row.favorite) }));
  const promptTags = rows<Record<string, unknown>>("PromptTag");
  const projects = rows<Record<string, unknown>>("Project").map(dates);
  const sessions = rows<Record<string, unknown>>("Session").map(dates);
  const interactions = rows<Record<string, unknown>>("Interaction").map(dates);

  await prisma.category.createMany({ data: categories as never[] });
  await prisma.tag.createMany({ data: tags as never[] });
  await prisma.subject.createMany({ data: subjects as never[] });
  await prisma.prompt.createMany({ data: prompts as never[] });
  await prisma.promptTag.createMany({ data: promptTags as never[] });
  await prisma.project.createMany({ data: projects as never[] });
  await prisma.session.createMany({ data: sessions as never[] });
  await prisma.interaction.createMany({ data: interactions as never[] });

  console.log("Migración completada", {
    categories: categories.length,
    prompts: prompts.length,
    tags: tags.length,
    promptTags: promptTags.length,
    subjects: subjects.length,
    projects: projects.length,
    sessions: sessions.length,
    interactions: interactions.length,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
