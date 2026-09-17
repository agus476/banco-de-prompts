"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_OWNER, NAV_ITEMS } from "@/lib/identity";
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

  const content = (
    <div className="flex h-full flex-col">
      <Link
        href="/biblioteca"
        className="flex items-center gap-2.5 px-3 py-4"
        onClick={() => setOpen(false)}
      >
        <AppLogo size={28} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold tracking-tight text-sidebar-fg">
            Banco de prompts
          </span>
          <span className="block truncate text-[11px] text-sidebar-muted">
            y bitácora de IA
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Principal">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/biblioteca"
              ? pathname === "/biblioteca" || pathname.startsWith("/biblioteca/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={active}
              onClick={() => setOpen(false)}
            />
          );
        })}

        {categories.length > 0 ? (
          <div className="pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] font-medium tracking-[0.14em] text-sidebar-muted uppercase"
              onClick={() => setCategoriesOpen((value) => !value)}
              aria-expanded={categoriesOpen}
            >
              Categorías
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-[180ms]",
                  !categoriesOpen && "-rotate-90",
                )}
              />
            </button>
            {categoriesOpen ? (
              <div className="mt-1 space-y-0.5">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/biblioteca?category=${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-sidebar-muted transition-colors duration-[180ms] hover:bg-sidebar-hover hover:text-sidebar-fg"
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
            ) : null}
          </div>
        ) : null}
      </nav>

      <div className="px-2 pb-3">
        <div className="rounded-lg bg-sidebar-hover/80 px-2.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-text-primary"
              aria-hidden
            >
              {APP_OWNER.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-sidebar-fg">
                {APP_OWNER.name}
              </span>
              <span className="block truncate text-[11px] text-sidebar-muted">
                {APP_OWNER.subtitle}
              </span>
            </span>
          </div>
          <div className="my-2.5 h-px bg-border" />
          <AppearanceControl />
          <LogoutButton />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed top-3 left-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-text-primary lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-4 w-4" />
      </button>

      <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 border-r border-border bg-sidebar text-sidebar-fg lg:block">
        {content}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[240px] bg-sidebar text-sidebar-fg">
            <button
              type="button"
              className="absolute top-3 right-3 text-sidebar-muted"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
