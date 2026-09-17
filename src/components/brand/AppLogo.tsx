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
      <rect width="32" height="32" rx="9" className="fill-surface-hover" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        className="stroke-border"
      />
      <path
        d="M10 9.5h9.2c.7 0 1.3.6 1.3 1.3v12.4c0 .7-.6 1.3-1.3 1.3H10c-.7 0-1.3-.6-1.3-1.3V10.8c0-.7.6-1.3 1.3-1.3Z"
        className="fill-surface stroke-border"
        strokeWidth="0.8"
      />
      <path d="M11.6 13.2h7M11.6 16.4h5.4M11.6 19.6h4" className="stroke-text-primary" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20.2" y="8" width="4.6" height="7.2" rx="1.2" className="fill-accent" />
    </svg>
  );
}
