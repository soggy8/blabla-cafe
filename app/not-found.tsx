import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Страницата не постои",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found-page">
        <p className="eyebrow">Грешка 404</p>
        <h1>
          Оваа страница <em>не постои.</em>
        </h1>
        <p>Можеби адресата е погрешна, или страницата е преместена.</p>
        <div className="not-found-actions">
          <Link className="button button-solid" href="/menu">
            Погледни го менито <ArrowUpRight size={17} />
          </Link>
          <Link className="button button-ghost" href="/">
            Почетна
          </Link>
        </div>
      </main>
    </>
  );
}
