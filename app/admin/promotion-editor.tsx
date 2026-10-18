"use client";

import Image from "next/image";
import { Eye, EyeOff, Tag } from "lucide-react";
import type { PromotionRecord } from "@/db/schema";
import {
  deletePromotionAction,
  savePromotionAction,
  setPromotionActiveAction,
} from "./actions";
import { LazyDetails } from "./item-editor";
import { SubmitButton } from "./submit-button";

export type EditablePromotion = Pick<
  PromotionRecord,
  "id" | "title" | "validity" | "description" | "endsOn" | "imagePath" | "link" | "active"
>;

const shortDate = new Intl.DateTimeFormat("mk-MK", { day: "numeric", month: "long" });

function status(promotion: EditablePromotion, today: string) {
  if (!promotion.active) return { label: "Скриена", tone: "off" };
  if (promotion.endsOn && promotion.endsOn < today) {
    return { label: "Истечена", tone: "off" };
  }
  if (promotion.endsOn) {
    return {
      label: `Видлива до ${shortDate.format(new Date(`${promotion.endsOn}T12:00:00`))}`,
      tone: "on",
    };
  }
  return { label: "Видлива", tone: "on" };
}

export function PromotionEditor({
  promotion,
  today,
}: {
  promotion: EditablePromotion;
  today: string;
}) {
  const { label, tone } = status(promotion, today);
  const toggleForm = `toggle-promo-${promotion.id}`;

  return (
    <>
      <form id={toggleForm} action={setPromotionActiveAction} hidden>
        <input type="hidden" name="id" value={promotion.id} />
        <input type="hidden" name="active" value={promotion.active ? "false" : "true"} />
      </form>
      <LazyDetails
        className={`admin-editor promo-editor${promotion.active ? "" : " is-hidden"}`}
        summary={
          <>
            <span className="item-summary">
              {promotion.imagePath ? (
                <Image
                  className="item-thumb"
                  src={promotion.imagePath}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                />
              ) : (
                <span className="item-thumb empty" aria-hidden="true">
                  <Tag size={16} />
                </span>
              )}
              <span>
                <strong>{promotion.title}</strong>
                <small>
                  <span className={`status-dot ${tone}`} /> {label}
                  {promotion.validity ? ` · ${promotion.validity}` : ""}
                </small>
              </span>
            </span>
            <span className="summary-actions">
              <button
                className="button button-ghost button-small"
                type="submit"
                form={toggleForm}
              >
                {promotion.active ? (
                  <>
                    <EyeOff size={15} /> Скриј
                  </>
                ) : (
                  <>
                    <Eye size={15} /> Прикажи
                  </>
                )}
              </button>
              <span className="edit-label">Уреди</span>
            </span>
          </>
        }
      >
        <PromotionForm promotion={promotion} />
        <form action={deletePromotionAction}>
          <input type="hidden" name="id" value={promotion.id} />
          <button
            className="danger-link"
            onClick={(event) => {
              if (!confirm(`Да се избрише „${promotion.title}“?`)) event.preventDefault();
            }}
          >
            Избриши промоција
          </button>
        </form>
      </LazyDetails>
    </>
  );
}

export function PromotionForm({ promotion }: { promotion?: EditablePromotion }) {
  return (
    <form action={savePromotionAction} className="admin-form item-form">
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
      <div className="field-row">
        <label>
          Наслов
          <input
            name="title"
            defaultValue={promotion?.title}
            placeholder="на пр. Утринска промоција"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Кога важи
          <input
            name="validity"
            defaultValue={promotion?.validity}
            placeholder="на пр. Секој ден до 15:00"
            maxLength={80}
          />
        </label>
      </div>
      <label>
        Што нудите
        <textarea
          name="description"
          defaultValue={promotion?.description}
          rows={4}
          maxLength={600}
          placeholder={"Фреш + еспресо – 160 ден.\nКока-Кола + макијато – 130 ден."}
        />
        <small className="field-help">
          Секоја понуда во нов ред. Цената одделете ја со цртичка: „Еспресо – 60 ден.“
        </small>
      </label>
      <div className="field-row">
        <label>
          Скриј автоматски по
          <input name="endsOn" type="date" defaultValue={promotion?.endsOn ?? ""} />
          <small className="field-help">Оставете празно ако нема краен датум.</small>
        </label>
        <label>
          Линк до Instagram објава
          <input
            name="link"
            type="url"
            defaultValue={promotion?.link ?? ""}
            placeholder="https://www.instagram.com/p/..."
          />
        </label>
      </div>
      <div className="image-field">
        {promotion?.imagePath ? (
          <Image
            className="image-preview"
            src={promotion.imagePath}
            alt={`Фотографија за ${promotion.title}`}
            width={120}
            height={120}
            unoptimized
          />
        ) : null}
        <label>
          {promotion?.imagePath ? "Замени фотографија" : "Фотографија (по желба)"}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" />
          <small>JPG, PNG или WebP до 8 MB.</small>
        </label>
        {promotion?.imagePath ? (
          <label className="inline-check">
            <input name="removeImage" type="checkbox" />
            Отстрани фотографија
          </label>
        ) : null}
      </div>
      <div className="check-row">
        <label>
          <input name="active" type="checkbox" defaultChecked={promotion?.active ?? true} />
          Прикажи на страницата
        </label>
      </div>
      <SubmitButton>{promotion ? "Зачувај" : "Додај промоција"}</SubmitButton>
    </form>
  );
}
