import { formatDate } from "@/lib/dates";
import { outcomeStatusLabel } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import type { LogbookProject } from "@/lib/types";

export function collectTools(project: LogbookProject): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const session of project.sessions) {
    const label = session.model
      ? `${session.tool} — modelo ${session.model}`
      : session.tool;
    if (!seen.has(label)) {
      seen.add(label);
      lines.push(label);
    }
  }

  return lines;
}

export function hasLogbookText(value: string | null | undefined): value is string {
  return Boolean(value && value.trim());
}

export function logbookFilename(title: string, format: "md" | "txt"): string {
  return `bitacora-${slugify(title)}.${format}`;
}

export function renderLogbookMarkdown(project: LogbookProject): string {
  const lines: string[] = [];

  lines.push("# Bitácora de uso de Inteligencia Artificial");
  lines.push("");
  lines.push("## Trabajo");
  lines.push("");
  lines.push(`**Materia:** ${project.subject.name}`);
  lines.push(`**Trabajo práctico:** ${project.title}`);
  if (project.date) lines.push(`**Fecha:** ${formatDate(project.date)}`);
  if (hasLogbookText(project.institution)) lines.push(`**Institución:** ${project.institution}`);
  if (hasLogbookText(project.teacher)) lines.push(`**Docente:** ${project.teacher}`);
  if (hasLogbookText(project.description)) {
    lines.push("");
    lines.push(project.description.trim());
  }

  const tools = collectTools(project);
  lines.push("");
  lines.push("## Herramientas utilizadas");
  lines.push("");
  if (tools.length === 0) {
    lines.push("No se registraron herramientas.");
  } else {
    for (const tool of tools) {
      lines.push(`- ${tool}`);
    }
  }

  if (project.sessions.length === 0) {
    lines.push("");
    lines.push("No se registraron sesiones de IA en este trabajo.");
  }

  project.sessions.forEach((session, sessionIndex) => {
    lines.push("");
    lines.push(`## Sesión ${sessionIndex + 1}: ${session.title}`);
    lines.push("");
    lines.push(`**Fecha:** ${formatDate(session.date)}`);
    lines.push(`**Herramienta:** ${session.tool}`);
    if (hasLogbookText(session.model)) lines.push(`**Modelo:** ${session.model}`);
    if (hasLogbookText(session.conversationUrl)) {
      lines.push(`**URL de la conversación:** ${session.conversationUrl}`);
    }
    if (hasLogbookText(session.observations)) {
      lines.push("");
      lines.push(session.observations.trim());
    }

    if (session.interactions.length === 0) {
      lines.push("");
      lines.push("No se registraron interacciones en esta sesión.");
    }

    for (const interaction of session.interactions) {
      lines.push("");
      lines.push(`### Prompt ${interaction.order}`);
      lines.push("");
      lines.push(interaction.prompt.trim() || "*(Sin prompt registrado)*");

      lines.push("");
      lines.push("### Respuesta");
      lines.push("");
      lines.push(
        hasLogbookText(interaction.response)
          ? interaction.response.trim()
          : "*(Sin respuesta registrada)*",
      );

      if (hasLogbookText(interaction.outcome)) {
        lines.push("");
        lines.push("### Resultado");
        lines.push("");
        lines.push(interaction.outcome.trim());
      }

      if (hasLogbookText(interaction.decision)) {
        lines.push("");
        lines.push("### Decisión tomada");
        lines.push("");
        lines.push(interaction.decision.trim());
      }

      if (hasLogbookText(interaction.generatedCode)) {
        lines.push("");
        lines.push("### Código generado");
        lines.push("");
        lines.push("```");
        lines.push(interaction.generatedCode.trim());
        lines.push("```");
      }

      if (hasLogbookText(interaction.affectedFiles)) {
        lines.push("");
        lines.push(`**Archivos afectados:** ${interaction.affectedFiles.trim()}`);
      }

      if (hasLogbookText(interaction.conceptsToStudy)) {
        lines.push("");
        lines.push(`**Conceptos a estudiar:** ${interaction.conceptsToStudy.trim()}`);
      }

      if (hasLogbookText(interaction.notes)) {
        lines.push("");
        lines.push("### Notas");
        lines.push("");
        lines.push(interaction.notes.trim());
      }

      if (interaction.outcomeStatus && interaction.outcomeStatus !== "PENDING") {
        lines.push("");
        lines.push(
          `**Estado de la solución:** ${outcomeStatusLabel(interaction.outcomeStatus)}`,
        );
      }
    }
  });

  if (hasLogbookText(project.notes)) {
    lines.push("");
    lines.push("## Notas del proyecto");
    lines.push("");
    lines.push(project.notes.trim());
  }

  if (hasLogbookText(project.conclusions)) {
    lines.push("");
    lines.push("## Conclusiones del proceso");
    lines.push("");
    lines.push(project.conclusions.trim());
  }

  lines.push("");
  return lines.join("\n");
}

export function renderLogbookPlainText(project: LogbookProject): string {
  return renderLogbookMarkdown(project)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\- /gm, "• ")
    .replace(/```\n?/g, "");
}
