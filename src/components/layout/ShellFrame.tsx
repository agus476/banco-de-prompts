"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function ShellFrame({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isDelivery = /\/proyectos\/[^/]+\/bitacora$/.test(pathname);
  const isLibrary =
    pathname.startsWith("/biblioteca") || pathname.startsWith("/favoritos");

  if (isDelivery) {
    return <>{children}</>;
  }

  if (isLibrary) {
    return (
      <div className="flex h-dvh overflow-hidden bg-background text-text-primary">
        {sidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-text-primary">
      {sidebar}
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 pl-16 lg:px-8 lg:pl-8">
          {children}
        </div>
      </div>
    </div>
  );
}
