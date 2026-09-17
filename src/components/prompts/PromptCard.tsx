import Link from "next/link";
import { CategoryGlyph } from "@/components/brand/CategoryGlyph";
import { ToolMark } from "@/components/brand/ToolMark";
import { FavoriteButton } from "@/components/prompts/FavoriteButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Badge } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import type { PromptWithRelations } from "@/lib/types";

export function PromptCard({
  prompt,
  href,
  selected = false,
}: {
  prompt: PromptWithRelations;
  href: string;
  selected?: boolean;
}) {
  return (
    <article
      className={cn(
        "group rounded-lg border px-3.5 py-3.5 transition-colors duration-200",
        selected
          ? "border-accent/50 bg-accent-soft shadow-card"
          : "border-border bg-surface shadow-card hover:border-accent/40 hover:bg-surface-hover/50",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Link href={href} className="min-w-0 flex-1" aria-current={selected ? "page" : undefined}>
          <div className="flex items-start gap-2.5">
            <CategoryGlyph name={prompt.category.name} className="mt-0.5 h-8 w-8 rounded-md" />
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[13px] leading-5 font-semibold text-text-primary">{prompt.title}</h2>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-text-secondary">
                {prompt.description || prompt.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge tone="muted">{prompt.category.name}</Badge>
                {prompt.tags.slice(0, 3).map((item) => (
                  <Badge key={item.tag.id}>{item.tag.name}</Badge>
                ))}
                {prompt.tags.length > 3 ? <Badge>+{prompt.tags.length - 3}</Badge> : null}
              </div>
            </div>
          </div>
        </Link>
        <FavoriteButton id={prompt.id} favorite={prompt.favorite} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 pl-[42px]">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-text-secondary">
          {prompt.tool ? (
            <>
              <ToolMark tool={prompt.tool} />
              <span className="truncate">{prompt.tool}</span>
            </>
          ) : (
            <span>Sin herramienta</span>
          )}
        </div>
        <CopyButton text={prompt.content} compact />
      </div>
    </article>
  );
}

export { PromptCard as PromptRow };
