"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
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

  if (urlQuery !== queryFromUrl) {
    setQueryFromUrl(urlQuery);
    setQuery(urlQuery);
  }

  function navigate(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const values = {
      q: next.q ?? query,
      category: next.category ?? category,
      tag: next.tag ?? tag,
      sort: next.sort ?? sort,
    };
    if (values.q) params.set("q", values.q);
    if (values.category) params.set("category", values.category);
    if (values.tag) params.set("tag", values.tag);
    if (values.sort && values.sort !== "recent") params.set("sort", values.sort);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath);
  }

  useEffect(() => {
    const next = query.trim();
    const current = (q ?? "").trim();
    if (next === current) return;
    const timeout = window.setTimeout(() => {
      navigate({ q: next || undefined });
    }, 200);
    return () => window.clearTimeout(timeout);
    // navigate uses current filter props; listing those avoids stale URLs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <form
      className="flex flex-col gap-2 px-4 pb-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ q: query.trim() || undefined });
      }}
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Buscar prompts</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar"
          className="h-9 w-full rounded-md border border-transparent bg-surface-hover pr-3 pl-9 text-[13px] text-text-primary outline-none transition-colors duration-[180ms] placeholder:text-text-secondary focus:bg-surface"
        />
      </label>
      <div className="sm:w-[148px]">
        <Select
          aria-label="Categoría"
          value={category ?? ""}
          onChange={(event) => navigate({ category: event.target.value || undefined })}
        >
          <option value="">Categoría</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-[128px]">
        <Select
          aria-label="Tag"
          value={tag ?? ""}
          onChange={(event) => navigate({ tag: event.target.value || undefined })}
        >
          <option value="">Tag</option>
          {tags.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <label className="relative sm:w-[148px]">
        <span className="sr-only">Ordenar</span>
        <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 z-10 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
        <Select
          aria-label="Ordenar"
          value={sort}
          onChange={(event) => navigate({ sort: event.target.value })}
          className="pl-9"
        >
          <option value="recent">Recientes</option>
          <option value="title">Título</option>
          <option value="created">Creados</option>
        </Select>
      </label>
    </form>
  );
}
