"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  bilder: string[];
  alt?: string;
  placeholder?: string;
};

export default function Bildgalleri({ bilder, alt = "", placeholder = "🏠" }: Props) {
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const touchStartX = useRef<number | null>(null);

  function goTo(newIndex: number) {
    setOpacity(0);
    setTimeout(() => {
      setIndex(newIndex);
      setOpacity(1);
    }, 150);
  }

  function prev() {
    goTo((index - 1 + bilder.length) % bilder.length);
  }

  function next() {
    goTo((index + 1) % bilder.length);
  }

  useEffect(() => {
    if (bilder.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goTo((index - 1 + bilder.length) % bilder.length);
      else if (e.key === "ArrowRight") goTo((index + 1) % bilder.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, bilder.length]);

  if (bilder.length === 0) {
    return (
      <div className="relative h-72 bg-[#e8f5ee] rounded-2xl flex items-center justify-center text-6xl opacity-30 mb-4">
        {placeholder}
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="relative h-72 bg-[#e8f5ee] rounded-2xl overflow-hidden mb-4"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (delta > 50) prev();
          else if (delta < -50) next();
        }}
      >
        <div style={{ opacity, transition: "opacity 150ms ease" }} className="absolute inset-0">
          <Image src={bilder[index]} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
        </div>

        {bilder.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:flex bg-white/80 hover:bg-white rounded-full w-9 h-9 items-center justify-center shadow transition-colors z-10 text-xl leading-none"
              aria-label="Föregående bild"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex bg-white/80 hover:bg-white rounded-full w-9 h-9 items-center justify-center shadow transition-colors z-10 text-xl leading-none"
              aria-label="Nästa bild"
            >
              ›
            </button>

            {/* Dot indicators (mobile) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
              {bilder.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/50"}`}
                  aria-label={`Bild ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (desktop only) */}
      {bilder.length > 1 && (
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto">
          {bilder.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === index ? "border-[#2D7A4F]" : "border-transparent"
              }`}
            >
              <div className="relative w-full h-full">
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
