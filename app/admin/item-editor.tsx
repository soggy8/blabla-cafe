"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { MenuItemRecord } from "@/db/schema";
import { deleteMenuItemAction, saveMenuItemAction } from "./actions";

export type EditableItem = Pick<
  MenuItemRecord,
  | "id"
  | "categoryId"
  | "slug"
  | "name"
  | "description"
  | "price"
  | "badge"
  | "imagePath"
  | "featured"
  | "available"
  | "sortOrder"
>;

export type CategoryOption = { id: string; name: string };

export function LazyDetails({
  className,
  summary,
  children,
  ...rest
}: {
  className: string;
  summary: ReactNode;
  children: ReactNode;
  "data-search"?: string;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <details
      className={className}
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true);
      }}
      {...rest}
    >
      <summary>{summary}</summary>
      {opened ? children : null}
    </details>
  );
}

export function ItemEditor({
  item,
  categories,
}: {
  item: EditableItem;
  categories: CategoryOption[];
}) {
  const search = [item.name, item.description, item.slug]
    .join(" ")
    .toLocaleLowerCase("mk");

  return (
    <LazyDetails
      className="admin-editor"
      data-search={search}
      summary={
        <>
          <span className="item-summary">
            {item.imagePath ? (
              <Image
                className="item-thumb"
                src={item.imagePath}
                alt=""
                width={44}
                height={44}
                loading="lazy"
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
        </>
      }
    >
      <MenuItemForm categories={categories} item={item} />
      <form action={deleteMenuItemAction}>
        <input type="hidden" name="id" value={item.id} />
        <button className="danger-link">Избриши производ</button>
      </form>
    </LazyDetails>
  );
}

export function MenuItemForm({
  categories,
  item,
}: {
  categories: CategoryOption[];
  item?: EditableItem;
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
