import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FolderKanban,
  GraduationCap,
  NotebookPen,
  Star,
  Tags,
} from "lucide-react";

export const APP_OWNER = {
  name: "Agus",
  subtitle: "Cuenta personal",
  initials: "AG",
};

export const NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/favoritos", label: "Favoritos", icon: Star },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/materias", label: "Materias", icon: GraduationCap },
  { href: "/bitacoras", label: "Bitácoras", icon: NotebookPen },
];

export const TOOL_MARKS: Record<
  string,
  { letter: string; bg: string; fg: string }
> = {
  ChatGPT: { letter: "G", bg: "#1f6f5b", fg: "#e8fff6" },
  Claude: { letter: "C", bg: "#9a5a3c", fg: "#fff4ec" },
  Gemini: { letter: "G", bg: "#355f9a", fg: "#eef5ff" },
  Copilot: { letter: "P", bg: "#4b4f8a", fg: "#eef0ff" },
  Cursor: { letter: "I", bg: "#3a3a3c", fg: "#f5f5f7" },
  Codex: { letter: "X", bg: "#1f6f5b", fg: "#e8fff6" },
  Otra: { letter: "·", bg: "#48484a", fg: "#f5f5f7" },
};

export function toolMark(tool?: string | null) {
  if (!tool) return TOOL_MARKS.Otra;
  return TOOL_MARKS[tool] ?? { letter: tool.slice(0, 1).toUpperCase(), bg: "#48484a", fg: "#f5f5f7" };
}
