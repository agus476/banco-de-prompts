import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors duration-[180ms]",
        active
          ? "bg-sidebar-active text-sidebar-fg"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg",
      )}
    >
      {active ? (
        <span className="absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full bg-accent" />
      ) : null}
      <Icon className={cn("h-[17px] w-[17px]", active && "text-accent")} />
      {label}
    </Link>
  );
}
