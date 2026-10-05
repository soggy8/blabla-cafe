import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { MenuBrowser } from "@/components/menu-browser";
import { PoweredBy } from "@/components/powered-by";
import { SiteHeader } from "@/components/site-header";
import { getMenu } from "@/lib/content";

export const metadata = {
  title: "Мени",
  description: "Целото мени на Bla Bla Cafe, Струмица: кафе, сокови, пиво, коктели и аперитиви.",
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
            <p className="eyebrow">Цело мени, долги муабети</p>
            <h1>Одбери го твојот <em>момент.</em></h1>
          </div>
          <p className="menu-note">
            Од првото еспресо до последниот коктел. Сите цени се во денари.
          </p>
        </section>
        <MenuBrowser categories={categories} items={items} />
        {source === "seed" ? (
          <p className="prototype-note">
            Прототип · менито моментално се вчитува од локални податоци
          </p>
        ) : null}
      </main>
      <footer className="menu-footer">
        <span>BLA BLA CAFE · СТРУМИЦА</span>
        <a href="https://www.instagram.com/blablacafe14/" target="_blank" rel="noreferrer">
          <Camera size={17} /> @blablacafe14
        </a>
        <PoweredBy />
      </footer>
    </>
  );
}
