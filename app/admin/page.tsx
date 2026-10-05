import { asc } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Database,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  LogOut,
  Plus,
} from "lucide-react";
import { getDb, hasDatabase } from "@/db/client";
import {
  menuCategories,
  menuItems,
  type MenuCategoryRecord,
  type MenuItemRecord,
} from "@/db/schema";
import { getCurrentOwner } from "@/lib/auth";
import {
  deleteMenuItemAction,
  logoutAction,
  saveCategoryAction,
  saveMenuItemAction,
} from "./actions";
import { ItemFilter } from "./item-filter";

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
        <details className="admin-editor">
          <summary>
            <span className="summary-title">
              <Plus size={17} /> Додај производ
            </span>
          </summary>
          <MenuItemForm categories={categories} />
        </details>

        <details className="admin-editor">
          <summary>
            <span className="summary-title">
              <FolderOpen size={17} /> Категории ({categories.length})
            </span>
          </summary>
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
        </details>
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
                    categories={categories}
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

function ItemEditor({
  item,
  categories,
}: {
  item: MenuItemRecord;
  categories: MenuCategoryRecord[];
}) {
  const search = [item.name, item.description, item.slug]
    .join(" ")
    .toLocaleLowerCase("mk");

  return (
    <details className="admin-editor" data-search={search}>
      <summary>
        <span className="item-summary">
          {item.imagePath ? (
            <Image
              className="item-thumb"
              src={item.imagePath}
              alt=""
              width={44}
              height={44}
              unoptimized
            />
          ) : (
            <span className="item-thumb empty" aria-hidden="true">
              <ImageIcon size={16} />
            </span>
          )}
          <span>
            <strong>{item.name}</strong>
            <small>
              {item.price ? `${item.price} ден.` : "цена по избор"} ·{" "}
              {item.available ? "достапно" : "скриено"}
              {item.featured ? " · истакнат" : ""}
            </small>
          </span>
        </span>
        <span className="edit-label">Уреди</span>
      </summary>
      <MenuItemForm categories={categories} item={item} />
      <form action={deleteMenuItemAction}>
        <input type="hidden" name="id" value={item.id} />
        <button className="danger-link">Избриши производ</button>
      </form>
    </details>
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

function MenuItemForm({
  categories,
  item,
}: {
  categories: MenuCategoryRecord[];
  item?: MenuItemRecord;
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
            placeholder="се создава автоматски"
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
      <div className="image-field">
        {item?.imagePath ? (
          <Image
            className="image-preview"
            src={item.imagePath}
            alt={`Фотографија од ${item.name}`}
            width={120}
            height={120}
            unoptimized
          />
        ) : null}
        <label>
          {item?.imagePath ? "Замени фотографија" : "Фотографија"}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
          <small>JPG, PNG или WebP до 8 MB.</small>
        </label>
        {item?.imagePath ? (
          <label className="inline-check">
            <input name="removeImage" type="checkbox" />
            Отстрани фотографија
          </label>
        ) : null}
      </div>
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
