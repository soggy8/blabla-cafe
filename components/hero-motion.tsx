"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroMotion() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="hero">
      <div className="hero-grain" />
      <div className="hero-copy">
        <motion.p
          className="hero-kicker"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Sparkles size={15} /> Кафе. Муабет. Bla Bla.
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.1 }}
        >
          Не доаѓаш
          <br />
          само на <em>кафе.</em>
        </motion.h1>
        <motion.p
          className="hero-intro"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          Од првото утринско еспресо до последниот вечерен муабет —
          твоето место во срцето на Струмица.
        </motion.p>
        <motion.div
          className="hero-actions"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <Link className="button button-light" href="/menu">
            Истражи го менито <ArrowDownRight size={18} />
          </Link>
          <a className="hero-address" href="#visit">
            Маршал Тито 146
            <small>Струмица · 08:00—01:00</small>
          </a>
        </motion.div>
      </div>

      <motion.div
        className="hero-art"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
      >
        <video
          className="hero-video"
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/hero-coffee-poster.webp"
          disablePictureInPicture
        >
          <source src="/media/hero-coffee.webm" type="video/webm" />
          <source src="/media/hero-coffee.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-shade" />
        <div className="hero-stamp">
          <span>EST.</span>
          <strong>2026</strong>
          <span>STRUMICA</span>
        </div>
      </motion.div>
    </section>
  );
}
