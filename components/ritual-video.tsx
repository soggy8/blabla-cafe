"use client";

import { useReducedMotion } from "motion/react";

export function RitualVideo() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="ritual-art" aria-hidden="true">
      <video
        className="ritual-video"
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="metadata"
        poster="/media/ritual-coffee-poster.webp"
        disablePictureInPicture
      >
        <source src="/media/ritual-coffee.webm" type="video/webm" />
        <source src="/media/ritual-coffee.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
