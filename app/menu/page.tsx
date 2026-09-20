import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { MenuBrowser } from "@/components/menu-browser";
import { SiteHeader } from "@/components/site-header";
import { getMenu } from "@/lib/content";

export const metadata = {
  title: "Мени",
  description: "Кафе, свежи пијалаци и вечерна понуда во Bla Bla Cafe, Струмица.",
};

export default async function MenuPage() {
  const { categories, items, source } = await getMenu();

  return (
    <>
      <SiteHeader />
      <main className="menu-page">
        <section className="menu-hero">
          <div>
            <Link href="/" className="back-link">
              <ArrowLeft size={16} /> Почетна
            </Link>
            <p className="eyebrow">Кратко мени, долги муабети</p>
            <h1>Одбери го твојот <em>момент.</em></h1>
          </div>
          <p className="menu-note">
            Ова е избор од јавно потврдената понуда. Целосното мени пристигнува
            наскоро.
          </p>
        </section>
        <MenuBrowser categories={categories} items={items} />
        {source === "seed" ? (
          <p className="prototype-note">
            Прототип · содржината моментално се вчитува од проверени демо-податоци
          </p>
        ) : null}
      </main>
      <footer className="menu-footer">
        <span>BLA BLA CAFE · СТРУМИЦА</span>
        <a href="https://www.instagram.com/blablacafe14/" target="_blank" rel="noreferrer">
          <Camera size={17} /> @blablacafe14
        </a>
      </footer>
    </>
  );
}
