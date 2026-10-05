"use client";

import { useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";

export function ItemFilter({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function filter(value: string) {
    setQuery(value);
    const list = listRef.current;
    if (!list) return;
    const needle = value.trim().toLocaleLowerCase("mk");
    let visible = 0;

    list.querySelectorAll<HTMLElement>("[data-group]").forEach((group) => {
      let groupVisible = 0;
      group.querySelectorAll<HTMLElement>("[data-search]").forEach((item) => {
        const match = !needle || item.dataset.search!.includes(needle);
        item.hidden = !match;
        if (match) groupVisible++;
      });
      group.hidden = Boolean(needle) && groupVisible === 0;
      visible += groupVisible;
    });

    setMatches(needle ? visible : null);
  }

  return (
    <>
      <div className="admin-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => filter(event.target.value)}
          placeholder="Пребарај производ…"
          aria-label="Пребарај производ"
        />
        {query ? (
          <button type="button" onClick={() => filter("")} aria-label="Исчисти">
            <X size={16} />
          </button>
        ) : null}
      </div>
      {matches === 0 ? (
        <p className="admin-empty">Нема производ што одговара на „{query}“.</p>
      ) : null}
      <div ref={listRef}>{children}</div>
    </>
  );
}
