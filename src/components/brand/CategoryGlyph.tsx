import {
  BarChart3,
  Brain,
  Bug,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Layers,
  PenLine,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";

export function CategoryGlyph({
  name,
  className,
  iconClassName = "h-4 w-4",
}: {
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  const slug = slugify(name);
  const icon =
    slug === "desarrollo" ? (
      <Code2 className={iconClassName} />
    ) : slug === "sql" ? (
      <Database className={iconClassName} />
    ) : slug === "debugging" ? (
      <Bug className={iconClassName} />
    ) : slug === "analisis-de-datos" ? (
      <BarChart3 className={iconClassName} />
    ) : slug === "machine-learning" ? (
      <Brain className={iconClassName} />
    ) : slug === "qa" ? (
      <CheckCircle2 className={iconClassName} />
    ) : slug === "documentacion" ? (
      <FileText className={iconClassName} />
    ) : slug === "redaccion" ? (
      <PenLine className={iconClassName} />
    ) : slug === "investigacion" ? (
      <Search className={iconClassName} />
    ) : slug === "general" ? (
      <Layers className={iconClassName} />
    ) : (
      <Sparkles className={iconClassName} />
    );

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-text-secondary",
        className,
      )}
      aria-hidden
    >
      {icon}
    </span>
  );
}
