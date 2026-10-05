import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Database,
  ExternalLink,
  FolderOpen,
  KeyRound,
  LogOut,
  Plus,
} from "lucide-react";
import { getDb, hasDatabase } from "@/db/client";
import {
  menuCategories,
  menuItems,
  type MenuCategoryRecord,
} from "@/db/schema";
import { getCurrentOwner } from "@/lib/auth";
import { logoutAction, saveCategoryAction } from "./actions";
import { ItemEditor, LazyDetails, MenuItemForm } from "./item-editor";
import { ItemFilter } from "./item-filter";
import { PasswordForm } from "./password-form";

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
    db
      .select({
        id: menuItems.id,
        categoryId: menuItems.categoryId,
        slug: menuItems.slug,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        badge: menuItems.badge,
        imagePath: menuItems.imagePath,
        featured: menuItems.featured,
        available: menuItems.available,
        sortOrder: menuItems.sortOrder,
      })
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder)),
  ]);
  const categoryOptions = categories.map(({ id, name }) => ({ id, name }));
  const nextCategoryOrder =
    Math.max(0, ...categories.map((category) => category.sortOrder)) + 1;

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

      <div className="admin-toolbar">
        <LazyDetails
          className="admin-editor"
          summary={
            <span className="summary-title">
              <Plus size={17} /> Додај производ
            </span>
          }
        >
          <MenuItemForm categories={categoryOptions} />
        </LazyDetails>

        <LazyDetails
          className="admin-editor"
          summary={
            <span className="summary-title">
              <FolderOpen size={17} /> Категории ({categories.length})
            </span>
          }
        >
          <div className="category-manager">
            <p className="admin-hint">
              Скриената категорија и нејзините производи не се прикажуваат на
              страницата. Помал редослед значи повисоко во менито.
            </p>
            {categories.map((category) => (
              <CategoryForm key={category.id} category={category} />
            ))}
            <CategoryForm nextOrder={nextCategoryOrder} />
          </div>
        </LazyDetails>

        <LazyDetails
          className="admin-editor"
          summary={
            <span className="summary-title">
              <KeyRound size={17} /> Лозинка · {owner.email}
            </span>
          }
        >
          <div className="category-manager">
            <PasswordForm />
          </div>
        </LazyDetails>
      </div>

      <section className="admin-grid">
        <ItemFilter>
          {categories.map((category) => {
            const categoryItems = items.filter(
              (item) => item.categoryId === category.id,
            );
            return (
              <section className="admin-group" data-group key={category.id}>
                <h2>
                  {category.name}
                  <small>
                    {categoryItems.length} производи
                    {category.active ? "" : " · скриена"}
                  </small>
                </h2>
                {categoryItems.length === 0 ? (
                  <p className="admin-empty">Нема производи во оваа категорија.</p>
                ) : null}
                {categoryItems.map((item) => (
                  <ItemEditor
                    key={item.id}
                    item={item}
                    categories={categoryOptions}
                  />
                ))}
              </section>
            );
          })}
        </ItemFilter>
      </section>
    </main>
  );
}

function CategoryForm({
  category,
  nextOrder,
}: {
  category?: MenuCategoryRecord;
  nextOrder?: number;
}) {
  return (
    <form
      action={saveCategoryAction}
      className={`admin-form category-form${category ? "" : " new-category"}`}
    >
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <label>
        {category ? "Име" : "Нова категорија"}
        <input
          name="name"
          defaultValue={category?.name}
          placeholder={category ? undefined : "на пр. Десерти"}
          required
          minLength={2}
          maxLength={60}
        />
      </label>
      <label>
        Поднаслов
        <input
          name="eyebrow"
          defaultValue={category?.eyebrow}
          maxLength={60}
        />
      </label>
      <label>
        Редослед
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={category?.sortOrder ?? nextOrder}
          required
        />
      </label>
      <label className="inline-check">
        <input
          name="active"
          type="checkbox"
          defaultChecked={category?.active ?? true}
        />
        Видлива
      </label>
      <button className="button button-solid" type="submit">
        {category ? "Зачувај" : "Додај"}
      </button>
    </form>
  );
}
