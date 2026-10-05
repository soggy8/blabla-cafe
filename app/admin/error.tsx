"use client";

import Link from "next/link";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="admin-shell">
      <section className="setup-card">
        <p className="eyebrow">Промената не е зачувана</p>
        <h1>Нешто тргна наопаку.</h1>
        <p>
          Проверете ги внесените податоци. Фотографиите мора да бидат JPG, PNG
          или WebP и помали од 8 MB. Ако проблемот продолжи, освежете ја
          страницата и најавете се повторно.
        </p>
        <div className="admin-actions">
          <button className="button button-solid" onClick={() => retry()}>
            Обиди се повторно
          </button>
          <Link className="button button-ghost" href="/admin">
            Назад кон менито
          </Link>
        </div>
      </section>
    </main>
  );
}
