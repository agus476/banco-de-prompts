import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";
import {
  logbookFilename,
  renderLogbookMarkdown,
  renderLogbookPlainText,
} from "@/lib/export-logbook";
import type { LogbookProject } from "@/lib/types";

function project(overrides: Partial<LogbookProject> = {}): LogbookProject {
  return {
    id: "p1",
    title: "TPE 3 — Algoritmos de búsqueda",
    description: "Implementar BFS",
    date: new Date("2026-03-12T12:00:00"),
    institution: "Universidad",
    teacher: "Docente",
    status: "IN_PROGRESS",
    notes: null,
    conclusions: "Se adoptó una cola y un conjunto de visitados.",
    subjectId: "s1",
    createdAt: new Date(),
    updatedAt: new Date(),
    subject: {
      id: "s1",
      name: "Introducción a Inteligencia Artificial",
      slug: "ia",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    sessions: [
      {
        id: "sess1",
        title: "Implementación de BFS",
        tool: "ChatGPT",
        model: "GPT-4",
        date: new Date("2026-03-12T12:00:00"),
        conversationUrl: "https://example.com/chat",
        observations: null,
        projectId: "p1",
        createdAt: new Date(),
        updatedAt: new Date(),
        interactions: [
          {
            id: "i1",
            order: 1,
            prompt: "Necesito implementar búsqueda BFS en Python.",
            response: "Usá una cola.",
            notes: null,
            generatedCode: "from collections import deque",
            decision: "Se modificó la estructura para utilizar una cola.",
            outcome: "La solución propuesta funcionó parcialmente.",
            outcomeStatus: "MODIFIED",
            affectedFiles: "bfs.py",
            conceptsToStudy: "BFS, colas",
            sessionId: "sess1",
            libraryPromptId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("slugify", () => {
  it("normaliza acentos y espacios", () => {
    expect(slugify("Algoritmos de búsqueda")).toBe("algoritmos-de-busqueda");
  });

  it("no devuelve un slug vacío", () => {
    expect(slugify("***")).toBe("item");
  });

  it("genera slugs únicos", async () => {
    const taken = new Set(["bfs"]);
    const slug = await uniqueSlug("BFS", async (value) => taken.has(value));
    expect(slug).toBe("bfs-2");
  });
});

describe("exportación de bitácora", () => {
  it("incluye solo evidencia registrada", () => {
    const markdown = renderLogbookMarkdown(project());

    expect(markdown).toContain("# Bitácora de uso de Inteligencia Artificial");
    expect(markdown).toContain("Introducción a Inteligencia Artificial");
    expect(markdown).toContain("TPE 3 — Algoritmos de búsqueda");
    expect(markdown).toContain("ChatGPT — modelo GPT-4");
    expect(markdown).toContain("Necesito implementar búsqueda BFS en Python.");
    expect(markdown).toContain("Usá una cola.");
    expect(markdown).toContain("Se modificó la estructura para utilizar una cola.");
    expect(markdown).toContain("Se adoptó una cola y un conjunto de visitados.");
    expect(markdown).not.toContain("invent");
  });

  it("no fabrica sesiones ni conclusiones vacías", () => {
    const empty = project({
      sessions: [],
      conclusions: null,
      notes: null,
      description: null,
    });
    const markdown = renderLogbookMarkdown(empty);

    expect(markdown).toContain("No se registraron sesiones de IA en este trabajo.");
    expect(markdown).toContain("No se registraron herramientas.");
    expect(markdown).not.toContain("## Conclusiones del proceso");
    expect(markdown).not.toContain("## Sesión 1");
  });

  it("marca respuestas vacías como no registradas en lugar de inventarlas", () => {
    const withEmptyResponse = project();
    withEmptyResponse.sessions[0].interactions[0].response = "";
    withEmptyResponse.sessions[0].interactions[0].decision = null;

    const markdown = renderLogbookMarkdown(withEmptyResponse);
    expect(markdown).toContain("*(Sin respuesta registrada)*");
    expect(markdown).not.toContain("### Decisión tomada");
  });

  it("exporta texto plano sin markdown estructural", () => {
    const text = renderLogbookPlainText(project());
    expect(text).not.toMatch(/^# /m);
    expect(text).toContain("Bitácora de uso de Inteligencia Artificial");
    expect(text).toContain("Necesito implementar búsqueda BFS en Python.");
  });

  it("arma un nombre de archivo estable", () => {
    expect(logbookFilename("TPE 3 — Algoritmos de búsqueda", "md")).toBe(
      "bitacora-tpe-3-algoritmos-de-busqueda.md",
    );
  });
});
