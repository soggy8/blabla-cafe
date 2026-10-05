"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
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
        <div className="category-tabs" role="tablist" aria-label="Категории">
          <button
            className={active === "all" ? "active" : ""}
            onClick={() => setActive("all")}
          >
            Сè
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={active === category.id ? "active" : ""}
              onClick={() => setActive(category.id)}
            >
              {category.name}
            </button>
          ))}
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
      <div className="menu-list">
        {groups.map(({ category, items: groupItems }) => (
          <section className="menu-group" key={category.id} aria-labelledby={`menu-${category.id}`}>
            <header className="menu-group-heading">
              <h2 id={`menu-${category.id}`}>{category.name}</h2>
              {category.eyebrow ? <span>{category.eyebrow}</span> : null}
            </header>
            {groupItems.map((item, index) => (
              <article className="menu-row" key={item.id}>
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
