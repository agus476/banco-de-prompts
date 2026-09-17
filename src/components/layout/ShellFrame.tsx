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

  if (isDelivery || pathname === "/login") {
    return <>{children}</>;
  }

  if (isLibrary) {
    return (
      <div className="flex h-dvh overflow-hidden bg-background pt-16 text-text-primary lg:pt-0">
        <a href="#main-content" className="sr-only fixed top-3 left-3 z-50 rounded-md bg-accent px-4 py-2 text-sm text-accent-fg focus:not-sr-only focus:fixed">
          Ir al contenido
        </a>
        {sidebar}
        <main id="main-content" tabIndex={-1} className="flex min-h-0 min-w-0 flex-1 flex-col outline-none">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background pt-16 text-text-primary lg:pt-0">
      <a href="#main-content" className="sr-only fixed top-3 left-3 z-50 rounded-md bg-accent px-4 py-2 text-sm text-accent-fg focus:not-sr-only focus:fixed">
        Ir al contenido
      </a>
      {sidebar}
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
        <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
