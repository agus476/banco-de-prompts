import type { ReactNode } from "react";
import { listCategories } from "@/lib/projects";
import { Sidebar } from "@/components/layout/Sidebar";
import { ShellFrame } from "@/components/layout/ShellFrame";

export async function AppShell({ children }: { children: ReactNode }) {
  const categories = await listCategories();

  return (
    <ShellFrame sidebar={<Sidebar categories={categories} />}>
      {children}
    </ShellFrame>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">{actions}</div> : null}
    </div>
  );
}
