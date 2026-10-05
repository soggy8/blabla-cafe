"use client";

import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="mk">
      <body>
        <main className="not-found-page">
          <p className="eyebrow">Грешка</p>
          <h1>
            Нешто <em>тргна наопаку.</em>
          </h1>
          <p>Обидете се повторно за неколку моменти.</p>
          <div className="not-found-actions">
            <button className="button button-solid" onClick={() => retry()}>
              Обиди се повторно
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a className="button button-ghost" href="/">
              Почетна
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
