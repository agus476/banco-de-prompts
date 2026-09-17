import { prisma } from "@/lib/prisma";
import { AI_TOOLS } from "@/lib/constants";

export type ImportInteractionItem = {
  order?: number;
  prompt: string;
  response?: string;
  notes?: string | null;
  decision?: string | null;
  outcome?: string | null;
  generatedCode?: string | null;
  affectedFiles?: string | null;
  conceptsToStudy?: string | null;
};

export type ImportPayload = {
  source?: string;
  tool?: string;
  model?: string | null;
  capturedAt?: string;
  sessionTitle?: string;
  sessionId?: string;
  projectId?: string;
  /** Formato corto: una sola interacción */
  interaction?: {
    prompt: string;
    response?: string;
    notes?: string | null;
    decision?: string | null;
    outcome?: string | null;
  };
  /** Formato largo: varias iteraciones */
  interactions?: ImportInteractionItem[];
};

export type ImportResult = {
  projectId: string;
  sessionId: string;
  interactionIds: string[];
  createdCount: number;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: unknown): string | null {
  const text = asTrimmedString(value);
  return text.length > 0 ? text : null;
}

function normalizeTool(tool: string | null | undefined): string {
  const value = asTrimmedString(tool) || "Cursor";
  if ((AI_TOOLS as readonly string[]).includes(value)) return value;
  return "Otra";
}

export function parseImportPayload(raw: unknown): ImportPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("El body debe ser un objeto JSON.");
  }

  const body = raw as Record<string, unknown>;
  const interactions: ImportInteractionItem[] = [];

  if (body.interaction && typeof body.interaction === "object" && !Array.isArray(body.interaction)) {
    const item = body.interaction as Record<string, unknown>;
    const prompt = asTrimmedString(item.prompt);
    if (!prompt) throw new Error("interaction.prompt es obligatorio.");
    interactions.push({
      prompt,
      response: asTrimmedString(item.response),
      notes: asOptionalString(item.notes),
      decision: asOptionalString(item.decision),
      outcome: asOptionalString(item.outcome),
      generatedCode: asOptionalString(item.generatedCode),
      affectedFiles: asOptionalString(item.affectedFiles),
      conceptsToStudy: asOptionalString(item.conceptsToStudy),
    });
  }

  if (Array.isArray(body.interactions)) {
    body.interactions.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error(`interactions[${index}] debe ser un objeto.`);
      }
      const item = entry as Record<string, unknown>;
      const prompt = asTrimmedString(item.prompt);
      if (!prompt) throw new Error(`interactions[${index}].prompt es obligatorio.`);
      interactions.push({
        order: typeof item.order === "number" ? item.order : undefined,
        prompt,
        response: asTrimmedString(item.response),
        notes: asOptionalString(item.notes),
        decision: asOptionalString(item.decision),
        outcome: asOptionalString(item.outcome),
        generatedCode: asOptionalString(item.generatedCode),
        affectedFiles: asOptionalString(item.affectedFiles),
        conceptsToStudy: asOptionalString(item.conceptsToStudy),
      });
    });
  }

  if (interactions.length === 0) {
    throw new Error("Mandá interaction o interactions con al menos un prompt.");
  }

  return {
    source: asOptionalString(body.source) ?? undefined,
    tool: normalizeTool(asOptionalString(body.tool)),
    model: asOptionalString(body.model),
    capturedAt: asOptionalString(body.capturedAt) ?? undefined,
    sessionTitle: asOptionalString(body.sessionTitle) ?? undefined,
    sessionId: asOptionalString(body.sessionId) ?? undefined,
    projectId: asOptionalString(body.projectId) ?? undefined,
    interactions,
  };
}

export async function importInteractions(payload: ImportPayload): Promise<ImportResult> {
  const items = payload.interactions ?? [];
  if (items.length === 0) {
    throw new Error("No hay interacciones para importar.");
  }

  let session =
    payload.sessionId
      ? await prisma.session.findUnique({ where: { id: payload.sessionId } })
      : null;

  if (payload.sessionId && !session) {
    throw new Error("La sesión indicada no existe.");
  }

  if (!session) {
    let projectId = payload.projectId;
    if (!projectId) {
      const latest = await prisma.project.findFirst({ orderBy: { updatedAt: "desc" } });
      if (!latest) {
        throw new Error("No hay proyectos. Creá uno en la app antes de importar.");
      }
      projectId = latest.id;
    } else {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error("El proyecto indicado no existe.");
    }

    const title =
      payload.sessionTitle ||
      `Importación VS Code · ${new Date().toLocaleString("es-AR")}`;

    session = await prisma.session.create({
      data: {
        projectId,
        title,
        tool: payload.tool || "Cursor",
        model: payload.model ?? null,
        date: payload.capturedAt ? new Date(payload.capturedAt) : new Date(),
        observations:
          payload.source
            ? `Importado desde ${payload.source}. Solo contiene lo enviado; no se inventó contenido.`
            : "Importado desde extensión. Solo contiene lo enviado; no se inventó contenido.",
      },
    });
  }

  const last = await prisma.interaction.findFirst({
    where: { sessionId: session.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let nextOrder = (last?.order ?? 0) + 1;
  const interactionIds: string[] = [];

  for (const item of items) {
    const created = await prisma.interaction.create({
      data: {
        sessionId: session.id,
        order: item.order && item.order > 0 ? item.order : nextOrder,
        prompt: item.prompt,
        response: item.response ?? "",
        notes: item.notes ?? null,
        decision: item.decision ?? null,
        outcome: item.outcome ?? null,
        generatedCode: item.generatedCode ?? null,
        affectedFiles: item.affectedFiles ?? null,
        conceptsToStudy: item.conceptsToStudy ?? null,
      },
    });
    interactionIds.push(created.id);
    nextOrder = Math.max(nextOrder, created.order) + 1;
  }

  return {
    projectId: session.projectId,
    sessionId: session.id,
    interactionIds,
    createdCount: interactionIds.length,
  };
}
