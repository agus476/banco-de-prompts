import { NextRequest, NextResponse } from "next/server";
import {
  importInteractions,
  parseImportPayload,
} from "@/lib/import-interaction";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ error: "Token inválido." }, { status: 401 });
}

function checkToken(request: NextRequest) {
  const expected = process.env.IMPORT_TOKEN?.trim();
  if (!expected) return true;
  const header = request.headers.get("x-import-token") ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  return header === expected || bearer === expected;
}

/** Lista proyectos/sesiones para el picker de la extensión. */
export async function GET(request: NextRequest) {
  if (!checkToken(request)) return unauthorized();

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      subject: { select: { name: true } },
      sessions: {
        select: { id: true, title: true, tool: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

/** Importa una o más interacciones desde la extensión VS Code. */
export async function POST(request: NextRequest) {
  if (!checkToken(request)) return unauthorized();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    const payload = parseImportPayload(raw);
    const result = await importInteractions(payload);
    return NextResponse.json({
      ok: true,
      ...result,
      url: `/proyectos/${result.projectId}/sesiones/${result.sessionId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo importar.";
    const status = message.includes("no existe") || message.includes("No hay")
      ? 404
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
