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

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("mk");
    return items.filter(
      (item) =>
        item.available &&
        (active === "all" || item.categoryId === active) &&
        (!normalized ||
          `${item.name} ${item.description}`
            .toLocaleLowerCase("mk")
            .includes(normalized)),
    );
  }, [active, items, query]);

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
        {visible.map((item, index) => (
          <article className="menu-row" key={item.id}>
            <span className="menu-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="menu-name-line">
                <h2>{item.name}</h2>
                {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
              </div>
              <p>{item.description}</p>
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
        {!visible.length ? (
          <p className="empty-state">Нема производи што одговараат на пребарувањето.</p>
        ) : null}
      </div>
    </>
  );
}
