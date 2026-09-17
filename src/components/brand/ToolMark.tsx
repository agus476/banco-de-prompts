import { cn } from "@/lib/cn";
import { toolMark } from "@/lib/identity";

export function ToolMark({
  tool,
  className,
}: {
  tool?: string | null;
  className?: string;
}) {
  const mark = toolMark(tool);
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-[5px] text-[9px] font-semibold",
        className,
      )}
      style={{ background: mark.bg, color: mark.fg }}
      aria-hidden
    >
      {mark.letter}
    </span>
  );
}
