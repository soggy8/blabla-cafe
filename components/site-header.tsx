"use client";

import Link from "next/link";
import { Coffee, Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-mark">
          <Coffee size={18} />
        </span>
        <span>
          BLA BLA
          <small>CAFE · STRUMICA</small>
        </span>
      </Link>
      <button
        className="mobile-menu-button"
        aria-expanded={open}
        aria-label={open ? "Затвори мени" : "Отвори мени"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "site-nav is-open" : "site-nav"}>
        <Link href="/#story" onClick={() => setOpen(false)}>
          Приказна
        </Link>
        <Link href="/menu" onClick={() => setOpen(false)}>
          Мени
        </Link>
        <Link href="/#social" onClick={() => setOpen(false)}>
          Моменти
        </Link>
        <Link href="/#visit" className="nav-cta" onClick={() => setOpen(false)}>
          Посети нè
        </Link>
      </nav>
    </header>
  );
}
