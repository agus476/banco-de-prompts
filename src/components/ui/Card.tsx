import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  padded = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface shadow-card",
        padded && "p-5 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function NoteBlock({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-background px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}
