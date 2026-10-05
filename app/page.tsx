import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera, Clock3, MapPin, Phone, Sparkles } from "lucide-react";
import { HeroMotion } from "@/components/hero-motion";
import { PoweredBy } from "@/components/powered-by";
import { RitualVideo } from "@/components/ritual-video";
import { SiteHeader } from "@/components/site-header";
import { socialPosts } from "@/data/menu";
import { getMenu } from "@/lib/content";

export default async function Home() {
  const { items } = await getMenu();
  const featured = items.filter((item) => item.featured && item.available).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main>
        <HeroMotion />

        <section className="manifesto section-shell" id="story">
          <p className="vertical-label">НАШАТА ПРИКАЗНА</p>
          <div className="manifesto-copy">
            <p className="eyebrow"><Sparkles size={14} /> За нас</p>
            <h2>Кафе наутро,<br /><em>коктели навечер.</em></h2>
          </div>
          <div className="manifesto-side">
            <p>
              Bla Bla е урбано катче за првото кафе, попладневната пауза и
              вечерите што спонтано траат подолго.
            </p>
            <span>Маршал Тито 146 · Струмица</span>
          </div>
        </section>

        <section className="featured-section">
          <div className="section-heading section-shell">
            <div>
              <p className="eyebrow">Избрано од барот</p>
              <h2>Неколку добри <em>причини.</em></h2>
            </div>
            <Link href="/menu" className="circle-link" aria-label="Целото мени">
              <ArrowUpRight />
            </Link>
          </div>
          <div className="featured-grid section-shell">
            {featured.map((item, index) => (
              <article className={`feature-card feature-${index + 1}`} key={item.id}>
                <div className="feature-visual">
                  {item.image ? (
                    <Image
                      className="feature-photo"
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 25vw"
                    />
                  ) : (
                    <>
                      <span className="feature-glow" aria-hidden="true" />
                      <span className="feature-vessel" aria-hidden="true" />
                    </>
                  )}
                  <span className="feature-number" aria-hidden="true">0{index + 1}</span>
                </div>
                <div className="feature-copy">
                  <div>
                    {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <strong>{item.price ? `${item.price} ден.` : "Дознај повеќе"}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ritual-section">
          <RitualVideo />
          <div className="ritual-copy">
            <p className="eyebrow">Бавно подготвено</p>
            <h2>Кафе на <em>песок.</em></h2>
            <p>
              Џезве, жежок песок, локум и чаша вода. Не е само кафе — туку
              ритуал што бара да забавиш.
            </p>
            <Link className="text-link light-link" href="/menu">
              Погледни ја понудата <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        <section className="social-section section-shell" id="social">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Camera size={15} /> @blablacafe14</p>
              <h2>Свежо од <em>feed.</em></h2>
            </div>
            <a href="https://www.instagram.com/blablacafe14/" target="_blank" rel="noreferrer" className="text-link">
              Следи нè <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="social-grid">
            {socialPosts.map((post, index) => (
              <a className={`social-card social-${post.kind}`} href={post.href} target="_blank" rel="noreferrer" key={post.id}>
                <span className="social-date">{post.date}</span>
                <span className="social-shape" aria-hidden="true" />
                <h3>{post.title}</h3>
                <span className="social-arrow"><ArrowUpRight /></span>
                <span className="social-index">0{index + 1}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="visit-section" id="visit">
          <div className="visit-map">
            <iframe
              title="Bla Bla Cafe на мапа"
              src="https://maps.google.com/maps?q=Bla%20Bla%20cafe%2C%20%D0%A1%D1%82%D1%80%D1%83%D0%BC%D0%B8%D1%86%D0%B0&ll=41.4306103,22.6447168&z=17&hl=mk&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="visit-copy">
            <p className="eyebrow">Посети нè</p>
            <h2>Маршал Тито 146, <em>Струмица.</em></h2>
            <ul>
              <li><MapPin /><span>Маршал Тито 146<small>Струмица 2400</small></span></li>
              <li><Clock3 /><span>Секој ден<small>08:00—01:00</small></span></li>
              <li><Phone /><span>Јави се<small>078 242 666</small></span></li>
            </ul>
            <div className="visit-actions">
              <a className="button button-solid" href="https://maps.app.goo.gl/BXxff3uKEQ66hwVYA" target="_blank" rel="noreferrer">
                Отвори насоки <ArrowUpRight size={17} />
              </a>
              <a className="button button-ghost" href="tel:+38978242666">Јави се</a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div>
          <span>КАФЕ · МУАБЕТ · СТРУМИЦА</span>
          <PoweredBy />
          <span>© 2026 BLA BLA CAFE</span>
        </div>
      </footer>
    </>
  );
}
