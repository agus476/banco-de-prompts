import { cn } from "@/lib/cn";

export function AppLogo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        className="stroke-accent-fg/15"
      />
      <path
        d="M9 8.5h14v15H9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Zm0 12h14"
        className="stroke-accent-fg"
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m11 12 2.5 2.5L11 17m5 0h3" className="stroke-accent-fg" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
