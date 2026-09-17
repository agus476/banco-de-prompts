"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/identity";
import { AppLogo } from "@/components/brand/AppLogo";
import { CategoryGlyph } from "@/components/brand/CategoryGlyph";
import { AppearanceControl } from "@/components/layout/AppearanceControl";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SidebarItem } from "@/components/ui/SidebarItem";

type SidebarProps = {
  categories: { name: string; slug: string }[];
};

export function Sidebar({ categories }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop() {
      if (desktop.matches) dialog?.close();
    }
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function closeMenu() {
    dialogRef.current?.close();
  }

  function content(mobile = false) {
    const categoriesId = `${menuId}-${mobile ? "mobile" : "desktop"}-categories`;

    return (
      <div className="flex h-full flex-col">
        <Link
          href="/biblioteca"
          className={cn("flex items-center gap-3 px-5 py-7", mobile && "pr-12")}
          onClick={closeMenu}
        >
          <AppLogo size={34} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-tight text-sidebar-fg">
              Banco de prompts
            </span>
            <span className="mt-0.5 block text-[11px] text-sidebar-muted">
              Tu espacio de trabajo con IA
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3" aria-label="Principal">
          <p className="px-2.5 pb-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-muted uppercase">
            Espacio de trabajo
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onClick={closeMenu}
              />
            ))}
          </div>

          {categories.length > 0 ? (
            <div className="mt-6 border-t border-border pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-[10px] font-semibold tracking-[0.16em] text-sidebar-muted uppercase hover:text-sidebar-fg"
                onClick={() => setCategoriesOpen((value) => !value)}
                aria-expanded={categoriesOpen}
                aria-controls={categoriesId}
              >
                Categorías
                <ChevronDown
                  aria-hidden
                  className={cn("h-3.5 w-3.5 transition-transform duration-200", !categoriesOpen && "-rotate-90")}
                />
              </button>
              <div id={categoriesId} hidden={!categoriesOpen} className="mt-1 space-y-0.5">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/biblioteca?category=${encodeURIComponent(category.slug)}`}
                    onClick={closeMenu}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg"
                  >
                    <CategoryGlyph
                      name={category.name}
                      className="h-5 w-5 rounded-[6px] bg-transparent"
                      iconClassName="h-3.5 w-3.5"
                    />
                    <span className="truncate">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </nav>

        <div className="mt-5 border-t border-border px-5 py-4">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-muted uppercase">
            Preferencias
          </p>
          <AppearanceControl />
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-primary"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="dialog"
        >
          <Menu className="h-[18px] w-[18px]" aria-hidden />
        </button>
        <Link href="/biblioteca" className="flex items-center gap-2.5 text-[13px] font-semibold text-sidebar-fg">
          <AppLogo size={26} />
          Banco de prompts
        </Link>
      </div>

      <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 border-r border-border bg-sidebar text-sidebar-fg lg:block">
        {content()}
      </aside>

      <dialog
        ref={dialogRef}
        id={menuId}
        aria-label="Menú de navegación"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      >
        <aside className="relative h-full w-[min(300px,88vw)] border-r border-border bg-sidebar text-sidebar-fg shadow-xl">
          <button
            type="button"
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            <X className="h-[18px] w-[18px]" aria-hidden />
          </button>
          {content(true)}
        </aside>
      </dialog>
    </>
  );
}
