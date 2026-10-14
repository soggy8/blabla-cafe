"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuCategory, MenuItem } from "@/data/menu";

export function MenuBrowser({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories.find((category) => category.id === active);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.available) map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + 1);
    }
    return map;
  }, [items]);
  const totalCount = items.filter((item) => item.available).length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Deep link from a homepage feature card: /menu#item-<slug> scrolls that row into view
  // and flashes it, compensating for the sticky .menu-tools bar.
  useEffect(() => {
    const focusHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      const node = id ? document.getElementById(id) : null;
      if (!node) {
        setHighlight(null);
        return undefined;
      }
      const sticky = filterRef.current?.closest(".menu-tools")?.getBoundingClientRect().height ?? 0;
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: window.scrollY + node.getBoundingClientRect().top - (sticky + 16),
          behavior: "smooth",
        });
      });
      setHighlight(id);
      return window.setTimeout(() => setHighlight(null), 2600);
    };

    let timer = focusHash();
    const onHashChange = () => {
      if (timer) window.clearTimeout(timer);
      timer = focusHash();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const choose = (categoryId: string) => {
    setActive(categoryId);
    setOpen(false);
    const list = listRef.current;
    const tools = filterRef.current?.closest(".menu-tools");
    if (!list || !tools) return;
    const toolsHeight = tools.getBoundingClientRect().height;
    if (list.getBoundingClientRect().top < toolsHeight) {
      window.scrollTo({
        top: window.scrollY + list.getBoundingClientRect().top - toolsHeight,
        behavior: "smooth",
      });
    }
  };

  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("mk");
    const visible = items.filter(
      (item) =>
        item.available &&
        (active === "all" || item.categoryId === active) &&
        (!normalized ||
          `${item.name} ${item.description}`
            .toLocaleLowerCase("mk")
            .includes(normalized)),
    );
    return categories
      .map((category) => ({
        category,
        items: visible.filter((item) => item.categoryId === category.id),
      }))
      .filter((group) => group.items.length);
  }, [active, categories, items, query]);

  return (
    <>
      <div className="menu-tools">
        <div className="menu-filter" ref={filterRef}>
          <button
            type="button"
            className={`menu-filter-toggle${active !== "all" ? " is-filtered" : ""}`}
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls="menu-filter-panel"
            onClick={() => setOpen((value) => !value)}
          >
            <SlidersHorizontal size={16} />
            <span>{activeCategory ? activeCategory.name : "Филтер"}</span>
            <ChevronDown size={16} className="menu-filter-chevron" />
          </button>
          {active !== "all" ? (
            <button
              type="button"
              className="menu-filter-clear"
              aria-label="Исчисти филтер"
              onClick={() => choose("all")}
            >
              <X size={15} />
            </button>
          ) : null}
          {open ? (
            <div className="menu-filter-panel" id="menu-filter-panel">
              <p>Категории</p>
              <ul>
                <li>
                  <button
                    type="button"
                    className={active === "all" ? "active" : ""}
                    aria-pressed={active === "all"}
                    onClick={() => choose("all")}
                  >
                    <span>Сè</span>
                    <small>{totalCount}</small>
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      className={active === category.id ? "active" : ""}
                      aria-pressed={active === category.id}
                      onClick={() => choose(category.id)}
                    >
                      <span>{category.name}</span>
                      <small>{counts.get(category.id) ?? 0}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <label className="menu-search">
          <Search size={17} />
          <span className="sr-only">Пребарај мени</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пребарај..."
          />
        </label>
      </div>
      <div className="menu-list" ref={listRef}>
        {groups.map(({ category, items: groupItems }) => (
          <section className="menu-group" key={category.id} aria-labelledby={`menu-${category.id}`}>
            <header className="menu-group-heading">
              <h2 id={`menu-${category.id}`}>{category.name}</h2>
              {category.eyebrow ? <span>{category.eyebrow}</span> : null}
            </header>
            {groupItems.map((item, index) => (
              <article
                className={`menu-row${highlight === `item-${item.slug ?? item.id}` ? " is-target" : ""}`}
                id={`item-${item.slug ?? item.id}`}
                key={item.id}
              >
                <span className="menu-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="menu-name-line">
                    <h3>{item.name}</h3>
                    {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
                  </div>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                <strong className="menu-price">
                  {item.price ? (
                    <>
                      {item.price}
                      <small> ден.</small>
                    </>
                  ) : (
                    <small>прашај нè</small>
                  )}
                </strong>
              </article>
            ))}
          </section>
        ))}
        {!groups.length ? (
          <p className="empty-state">Нема производи што одговараат на пребарувањето.</p>
        ) : null}
      </div>
    </>
  );
}
