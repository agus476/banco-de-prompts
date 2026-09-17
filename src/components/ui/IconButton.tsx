import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors duration-[180ms] hover:bg-surface-hover hover:text-text-primary disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
