import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, ExternalLink, LogOut, Plus } from "lucide-react";
import { getDb, hasDatabase } from "@/db/client";
import { menuCategories, menuItems } from "@/db/schema";
import { getCurrentOwner } from "@/lib/auth";
import {
  deleteMenuItemAction,
  logoutAction,
  saveMenuItemAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasDatabase()) {
    return (
      <main className="admin-shell">
        <section className="setup-card">
          <Database size={28} />
          <p className="eyebrow">Подготвено за поврзување</p>
          <h1>Админ панелот е изграден.</h1>
          <p>
            Додајте <code>DATABASE_URL</code>, пуштете ги миграциите и seed
            командата. Јавната страница во меѓувреме го прикажува
            вграденото мени.
          </p>
          <Link className="button button-solid" href="/">
            Отвори ја страницата
          </Link>
        </section>
      </main>
    );
  }

  const owner = await getCurrentOwner();
  if (!owner) redirect("/admin/login");

  const db = getDb();
  const [categories, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder)),
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder)),
  ]);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Bla Bla контролна табла</p>
          <h1>Мени</h1>
        </div>
        <div className="admin-actions">
          <Link href="/menu" target="_blank" className="button button-ghost">
            Види мени <ExternalLink size={15} />
          </Link>
          <form action={logoutAction}>
            <button className="icon-button" title="Одјави се">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <details className="admin-editor new-item">
        <summary>
          <Plus size={17} /> Додај производ
        </summary>
        <MenuItemForm categories={categories} />
      </details>

      <section className="admin-grid">
        {items.map((item) => (
          <details className="admin-editor" key={item.id}>
            <summary>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.price ? `${item.price} ден.` : "цена по избор"} ·{" "}
                  {item.available ? "достапно" : "скриено"}
                </small>
              </span>
              <span className="edit-label">Уреди</span>
            </summary>
            <MenuItemForm categories={categories} item={item} />
            <form action={deleteMenuItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <button className="danger-link">Избриши производ</button>
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}

function MenuItemForm({
  categories,
  item,
}: {
  categories: (typeof menuCategories.$inferSelect)[];
  item?: typeof menuItems.$inferSelect;
}) {
  return (
    <form action={saveMenuItemAction} className="admin-form item-form">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="field-row">
        <label>
          Име
          <input name="name" defaultValue={item?.name} required minLength={2} />
        </label>
        <label>
          Slug
          <input
            name="slug"
            defaultValue={item?.slug}
            pattern="[a-z0-9-]+"
            required
          />
        </label>
      </div>
      <label>
        Опис
        <textarea name="description" defaultValue={item?.description} rows={3} />
      </label>
      <div className="field-row thirds">
        <label>
          Категорија
          <select name="categoryId" defaultValue={item?.categoryId} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Цена (ден.)
          <input name="price" type="number" min={1} defaultValue={item?.price ?? ""} />
        </label>
        <label>
          Редослед
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={item?.sortOrder ?? 0}
            required
          />
        </label>
      </div>
      <label>
        Ознака
        <input name="badge" defaultValue={item?.badge ?? ""} placeholder="Ново" />
      </label>
      <div className="check-row">
        <label>
          <input
            name="featured"
            type="checkbox"
            defaultChecked={item?.featured}
          />
          Истакнат производ
        </label>
        <label>
          <input
            name="available"
            type="checkbox"
            defaultChecked={item?.available ?? true}
          />
          Достапен
        </label>
      </div>
      <button className="button button-solid" type="submit">
        Зачувај
      </button>
    </form>
  );
}
