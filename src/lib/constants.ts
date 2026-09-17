export const AI_TOOLS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Cursor",
  "Codex",
  "Otra",
] as const;

export const PROJECT_STATUSES = [
  { value: "IN_PROGRESS", label: "En desarrollo" },
  { value: "COMPLETED", label: "Completado" },
  { value: "ARCHIVED", label: "Archivado" },
] as const;

export const OUTCOME_STATUSES = [
  { value: "PENDING", label: "Pendiente" },
  { value: "ACCEPTED", label: "Aceptada" },
  { value: "MODIFIED", label: "Modificada" },
  { value: "DISCARDED", label: "Descartada" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number]["value"];

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function outcomeStatusLabel(status: string): string {
  return OUTCOME_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export const DEFAULT_CATEGORIES = [
  "General",
  "Desarrollo",
  "SQL",
  "Debugging",
  "Análisis de datos",
  "Machine Learning",
  "QA",
  "Documentación",
  "Redacción",
  "Investigación",
] as const;
