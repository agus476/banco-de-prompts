"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, LoaderCircle, Search, X } from "lucide-react";
import { Select } from "@/components/ui/Form";

export type PromptSort = "recent" | "title" | "created";

type Props = {
  basePath: string;
  q?: string;
  category?: string;
  tag?: string;
  sort?: PromptSort;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
};

export function PromptFilters({
  basePath,
  q,
  category,
  tag,
  sort = "recent",
  categories,
  tags,
}: Props) {
  const router = useRouter();
  const urlQuery = q ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [queryFromUrl, setQueryFromUrl] = useState(urlQuery);
  const [pending, startTransition] = useTransition();

  if (urlQuery !== queryFromUrl) {
    setQueryFromUrl(urlQuery);
    setQuery(urlQuery);
  }

  const navigate = useCallback((next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const values = {
      q: query.trim(),
      category,
      tag,
      sort,
      ...next,
    };
    if (values.q) params.set("q", values.q);
    if (values.category) params.set("category", values.category);
    if (values.tag) params.set("tag", values.tag);
    if (values.sort && values.sort !== "recent") params.set("sort", values.sort);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    });
  }, [router, basePath, query, category, tag, sort]);

  useEffect(() => {
    const next = query.trim();
    const current = (q ?? "").trim();
    if (next === current || pending) return;
    const timeout = window.setTimeout(() => {
      navigate({ q: next });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, q, navigate, pending]);

  return (
    <form
      role="search"
      aria-label="Filtrar biblioteca"
      aria-busy={pending}
      className="grid grid-cols-2 items-center gap-2 px-5 pb-4 sm:grid-cols-3 lg:px-7 xl:grid-cols-[minmax(160px,1fr)_180px_130px_170px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ q: query.trim() });
      }}
    >
      <label className="relative col-span-2 min-w-0 sm:col-span-3 xl:col-span-1">
        <span className="sr-only">Buscar prompts</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden />
        <input
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en tus prompts…"
          className="h-10 w-full rounded-md border border-border bg-background pr-9 pl-10 text-[13px] text-text-primary transition-colors placeholder:text-text-secondary focus:border-accent focus:bg-surface"
        />
        {pending ? <LoaderCircle className="absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-accent" aria-hidden /> : null}
      </label>
      <div className="min-w-0">
        <Select
          name="category"
          aria-label="Categoría"
          className="h-10 border-border bg-surface"
          value={category ?? ""}
          onChange={(event) => navigate({ category: event.target.value || undefined })}
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-0">
        <Select
          name="tag"
          aria-label="Etiqueta"
          className="h-10 border-border bg-surface"
          value={tag ?? ""}
          onChange={(event) => navigate({ tag: event.target.value || undefined })}
        >
          <option value="">Etiquetas</option>
          {tags.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <label className="relative col-span-2 min-w-0 sm:col-span-1">
        <span className="sr-only">Ordenar</span>
        <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 z-10 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" aria-hidden />
        <Select
          name="sort"
          aria-label="Ordenar"
          value={sort}
          onChange={(event) => navigate({ sort: event.target.value })}
          className="h-10 border-border bg-surface pl-9"
        >
          <option value="recent">Última edición</option>
          <option value="title">Título A–Z</option>
          <option value="created">Más nuevos</option>
        </Select>
      </label>
      {query || category || tag || sort !== "recent" ? (
        <button
          type="button"
          className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary sm:col-span-3 xl:col-span-1"
          onClick={() => {
            setQuery("");
            navigate({ q: "", category: undefined, tag: undefined, sort: "recent" });
          }}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Limpiar
        </button>
      ) : null}
      <span className="sr-only" role="status">{pending ? "Actualizando resultados" : ""}</span>
    </form>
  );
}
