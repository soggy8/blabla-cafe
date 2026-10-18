import { asc, desc, isNotNull } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Camera,
  Database,
  ExternalLink,
  FolderOpen,
  House,
  ImageIcon,
  KeyRound,
  LogOut,
  Plus,
  Star,
  Tag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { getDb, hasDatabase } from "@/db/client";
import {
  menuCategories,
  menuItems,
  promotions as promotionsTable,
  socialPosts,
  type MenuCategoryRecord,
} from "@/db/schema";
import { getCurrentOwner } from "@/lib/auth";
import { HOME_FEATURED_LIMIT, isFoodCategory, splitFeatured } from "@/lib/featured";
import { looksLikePromotion, promotionFromCaption, todayInSkopje } from "@/lib/promotions";
import {
  importInstagramPromotionAction,
  logoutAction,
  saveCategoryAction,
  setFeaturedAction,
} from "./actions";
import { ItemEditor, LazyDetails, MenuItemForm, type EditableItem } from "./item-editor";
import { ItemFilter } from "./item-filter";
import { PasswordForm } from "./password-form";
import { PromotionEditor, PromotionForm } from "./promotion-editor";
import { SubmitButton } from "./submit-button";

export const dynamic = "force-dynamic";

const tabs = {
  menu: { label: "Мени", icon: UtensilsCrossed, hint: "Цени, опис, фотографии и категории на сите производи." },
  promotions: { label: "Промоции", icon: Tag, hint: "Понудите што се прикажуваат на почетната страница, веднаш под „За нас“." },
  home: {
    label: "Почетна",
    icon: House,
    hint: `Производите истакнати на почетната страница: најмногу ${HOME_FEATURED_LIMIT} во секој ред, по редоследот од менито.`,
  },
  account: { label: "Лозинка", icon: KeyRound, hint: "Промена на лозинката за најава." },
} as const;

type TabKey = keyof typeof tabs;

export default async function AdminPage(props: PageProps<"/admin">) {
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

  const { tab: requested } = await props.searchParams;
  const tab: TabKey =
    typeof requested === "string" && requested in tabs ? (requested as TabKey) : "menu";

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Bla Bla контролна табла</p>
          <h1>{tabs[tab].label}</h1>
        </div>
        <div className="admin-actions">
          <Link href="/" target="_blank" className="button button-ghost">
            Види страница <ExternalLink size={15} />
          </Link>
          <form action={logoutAction}>
            <button className="icon-button" title="Одјави се" aria-label="Одјави се">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Делови од контролната табла">
        {(Object.keys(tabs) as TabKey[]).map((key) => {
          const { label, icon: Icon } = tabs[key];
          return (
            <Link
              key={key}
              href={key === "menu" ? "/admin" : `/admin?tab=${key}`}
              className={key === tab ? "is-active" : undefined}
              aria-current={key === tab ? "page" : undefined}
            >
              <Icon size={17} /> {label}
            </Link>
          );
        })}
      </nav>
      <p className="admin-tab-hint">{tabs[tab].hint}</p>

      {tab === "menu" ? <MenuTab /> : null}
      {tab === "promotions" ? <PromotionsTab /> : null}
      {tab === "home" ? <HomeTab /> : null}
      {tab === "account" ? (
        <section className="admin-panel">
          <p className="admin-hint">Најавени сте како {owner.email}.</p>
          <PasswordForm />
        </section>
      ) : null}
    </main>
  );
}

const itemColumns = {
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
};

async function MenuTab() {
  const db = getDb();
  const [categories, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder)),
    db.select(itemColumns).from(menuItems).orderBy(asc(menuItems.sortOrder)),
  ]);
  const categoryOptions = categories.map(({ id, name }) => ({ id, name }));
  const nextCategoryOrder =
    Math.max(0, ...categories.map((category) => category.sortOrder)) + 1;

  return (
    <>
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
    </>
  );
}

async function PromotionsTab() {
  const db = getDb();
  const [promotions, posts] = await Promise.all([
    db.select().from(promotionsTable).orderBy(desc(promotionsTable.createdAt)),
    db
      .select({
        id: socialPosts.id,
        caption: socialPosts.caption,
        permalink: socialPosts.permalink,
        publishedAt: socialPosts.publishedAt,
      })
      .from(socialPosts)
      .where(isNotNull(socialPosts.caption))
      .orderBy(desc(socialPosts.publishedAt))
      .limit(30),
  ]);
  const today = todayInSkopje();
  const used = new Set(promotions.map((promotion) => promotion.link));
  // The cafe often posts the same promotion twice; show each caption once and
  // skip reposts of a promotion that was already added.
  const seenCaptions = new Set(
    posts.filter((post) => used.has(post.permalink)).map((post) => post.caption!.trim()),
  );
  const suggestions = posts
    .filter((post) => looksLikePromotion(post.caption))
    .filter((post) => {
      const key = post.caption!.trim();
      if (seenCaptions.has(key)) return false;
      seenCaptions.add(key);
      return true;
    })
    .slice(0, 4)
    .map((post) => ({ ...post, draft: promotionFromCaption(post.caption!) }));
  const postDate = new Intl.DateTimeFormat("mk-MK", { day: "numeric", month: "long" });

  return (
    <div className="admin-grid">
      <div className="admin-toolbar">
        <LazyDetails
          className="admin-editor"
          summary={
            <span className="summary-title">
              <Plus size={17} /> Додај промоција
            </span>
          }
        >
          <PromotionForm />
        </LazyDetails>
      </div>

      <section className="admin-group">
        <h2>
          Ваши промоции
          <small>
            {promotions.filter((promotion) => promotion.active).length} видливи
            од {promotions.length}
          </small>
        </h2>
        {promotions.length === 0 ? (
          <p className="admin-empty">
            Сè уште нема промоции. Додајте нова или преземете ја од Instagram подолу.
          </p>
        ) : null}
        {promotions.map((promotion) => (
          <PromotionEditor key={promotion.id} promotion={promotion} today={today} />
        ))}
      </section>

      <section className="admin-group">
        <h2>
          <span className="heading-icon">
            <Camera size={20} /> Од Instagram
          </span>
          <small>Предлози од вашите објави</small>
        </h2>
        {suggestions.length === 0 ? (
          <p className="admin-empty">
            Нема нови објави што личат на промоција. Објавите се преземаат
            автоматски на секои 6 часа.
          </p>
        ) : (
          <>
            <p className="admin-hint">
              Се додава како скриена промоција — проверете ја, па кликнете „Прикажи“.
            </p>
            <div className="suggestion-list">
              {suggestions.map((post) => (
                <article className="suggestion" key={post.id}>
                  <div>
                    <small>{postDate.format(post.publishedAt)}</small>
                    <strong>{post.draft.title}</strong>
                    {post.draft.validity ? <span>{post.draft.validity}</span> : null}
                    {post.draft.description ? (
                      <p>{post.draft.description.split("\n").slice(0, 3).join(" · ")}</p>
                    ) : null}
                  </div>
                  <div className="suggestion-actions">
                    <a href={post.permalink} target="_blank" rel="noreferrer" className="text-link">
                      Објава <ExternalLink size={13} />
                    </a>
                    <form action={importInstagramPromotionAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <SubmitButton className="button button-solid button-small" pendingLabel="Се додава...">
                        <Plus size={15} /> Додај
                      </SubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

async function HomeTab() {
  const db = getDb();
  const [categories, items] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder)),
    db.select(itemColumns).from(menuItems).orderBy(asc(menuItems.sortOrder)),
  ]);
  // Hidden categories are not on the site, so their items cannot be shown either.
  const visibleCategories = categories.filter((category) => category.active);
  const visibleIds = new Set(visibleCategories.map((category) => category.id));
  const foodIds = new Set(
    categories.filter((category) => isFoodCategory(category.slug)).map((category) => category.id),
  );
  const isFood = (item: EditableItem) => foodIds.has(item.categoryId);
  const listed = items.filter((item) => visibleIds.has(item.categoryId));
  const shown = splitFeatured(listed, isFood);

  const rows = [
    { key: "drinks", title: "Избрано од барот", note: "Пијалаци", shown: shown.drinks, food: false },
    { key: "food", title: "Нешто за јадење", note: "Тостови и торти", shown: shown.food, food: true },
  ] as const;

  return (
    <div className="admin-grid">
      {rows.map((row) => {
        const shownIds = new Set(row.shown.map((item) => item.id));
        const sameRow = listed.filter((item) => isFood(item) === row.food);
        const waiting = sameRow.filter((item) => item.featured && !shownIds.has(item.id));
        const candidates = sameRow.filter((item) => !item.featured && item.available);
        const full = row.shown.length >= HOME_FEATURED_LIMIT;

        return (
          <section className="admin-panel featured-panel" key={row.key}>
            <h2>
              {row.title}
              <small>
                {row.note} · {row.shown.length} од {HOME_FEATURED_LIMIT}
              </small>
            </h2>
            <ol className="featured-slots">
              {Array.from({ length: HOME_FEATURED_LIMIT }, (_, index) => {
                const item = row.shown[index];
                if (!item) {
                  return (
                    <li className="featured-slot empty" key={index}>
                      <Star size={18} /> Празно место
                    </li>
                  );
                }
                return (
                  <li className="featured-slot" key={item.id}>
                    <FeaturedThumb item={item} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.price ? `${item.price} ден.` : "цена по избор"}</small>
                    </span>
                    <FeaturedButton id={item.id} featured={false} label={`Отстрани ${item.name}`} />
                  </li>
                );
              })}
            </ol>

            {waiting.length ? (
              <div className="featured-waiting">
                <p className="admin-hint">
                  Истакнати, но не се прикажуваат
                  {full ? " (редот е полн)" : ""}:
                </p>
                <ul>
                  {waiting.map((item) => (
                    <li key={item.id}>
                      {item.name}
                      <small>{item.available ? "чека слободно место" : "производот е скриен"}</small>
                      <FeaturedButton id={item.id} featured={false} label={`Отстрани ${item.name}`} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {full ? (
              <p className="admin-hint">Редот е полн. Отстранете еден производ за да додадете друг.</p>
            ) : candidates.length ? (
              <form action={setFeaturedAction} className="admin-form featured-add">
                <input type="hidden" name="featured" value="true" />
                <label>
                  Додај производ
                  <select name="id" required defaultValue="">
                    <option value="" disabled>
                      Изберете од менито…
                    </option>
                    {visibleCategories.map((category) => {
                      const options = candidates.filter((item) => item.categoryId === category.id);
                      return options.length ? (
                        <optgroup label={category.name} key={category.id}>
                          {options.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                              {item.imagePath ? "" : " (без фотографија)"}
                            </option>
                          ))}
                        </optgroup>
                      ) : null;
                    })}
                  </select>
                </label>
                <SubmitButton pendingLabel="Се додава...">
                  <Plus size={15} /> Додај
                </SubmitButton>
              </form>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function FeaturedThumb({ item }: { item: EditableItem }) {
  return item.imagePath ? (
    <Image className="item-thumb" src={item.imagePath} alt="" width={44} height={44} unoptimized />
  ) : (
    <span className="item-thumb empty" aria-hidden="true">
      <ImageIcon size={16} />
    </span>
  );
}

function FeaturedButton({ id, featured, label }: { id: string; featured: boolean; label: string }) {
  return (
    <form action={setFeaturedAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="featured" value={String(featured)} />
      <SubmitButton className="icon-button" pendingLabel="…" title={label}>
        <X size={16} />
      </SubmitButton>
    </form>
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
      <SubmitButton>{category ? "Зачувај" : "Додај"}</SubmitButton>
    </form>
  );
}
