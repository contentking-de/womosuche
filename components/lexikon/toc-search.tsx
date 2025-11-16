"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type SearchItem = {
  id: string;
  term: string;
  slug: string;
};

export function TocSearch() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    const run = async () => {
      const q = debouncedQuery.trim();
      if (!q) {
        setItems([]);
        return;
      }
      controllerRef.current?.abort();
      const ctrl = new AbortController();
      controllerRef.current = ctrl;
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, take: "8" });
        const res = await fetch(`/api/lexikon?${params.toString()}`, {
          method: "GET",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("Suche fehlgeschlagen");
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
        setOpen(true);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  return (
    <div className="mb-4">
      <label htmlFor="toc-search" className="mb-2 block text-sm font-medium text-foreground">
        Lexikon durchsuchen
      </label>
      <Input
        id="toc-search"
        placeholder="Begriff suchen..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && items.length > 0 && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-background p-2 shadow-sm">
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="py-2 first:pt-0 last:pb-0">
                <Link
                  href={`/lexikon/${it.slug}`}
                  className="block truncate text-sky-700/80 hover:text-sky-700 dark:text-sky-300/80 dark:hover:text-sky-300"
                >
                  {it.term}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && !loading && debouncedQuery && items.length === 0 && (
        <div className="mt-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Keine Treffer
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
