"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function ProductGallery({ images }: { images: string[] }) {
  const safeImages = useMemo(
    () => images.filter(Boolean).length ? images.filter(Boolean) : ["/placeholder.png"],
    [images]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const selected = safeImages[selectedIndex];

  function prev() {
    setSelectedIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1
    );
  }

  function next() {
    setSelectedIndex((current) =>
      current === safeImages.length - 1 ? 0 : current + 1
    );
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStart === null) return;

    const end = e.changedTouches[0].clientX;
    const diff = touchStart - end;

    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }

    setTouchStart(null);
  }

  return (
    <div>
      <div
        className="group relative flex min-h-[560px] cursor-zoom-in items-center justify-center overflow-hidden rounded-[30px] bg-[#f1f5f9]"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMove}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={selected}
          alt="Product image"
          fill
          className="object-contain p-8 transition-transform duration-300"
          unoptimized
        />

        {zoom ? (
          <div
            className="pointer-events-none absolute inset-0 hidden bg-no-repeat lg:block"
            style={{
              backgroundImage: `url(${selected})`,
              backgroundSize: "190%",
              backgroundPosition: `${position.x}% ${position.y}%`,
            }}
          />
        ) : null}

        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[#0d5b82] shadow-sm">
          <span className="inline-flex items-center gap-1">
            <Search size={14} />
            Zoom
          </span>
        </div>

        {safeImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-sm transition hover:scale-105 md:flex"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-sm transition hover:scale-105 md:flex"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {safeImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition ${
              selectedIndex === index
                ? "border-[#0d5b82] shadow-sm"
                : "border-[#e1e7f1] hover:border-[#0d5b82]"
            }`}
          >
            <Image
              src={image}
              alt={`Product thumbnail ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>

      {safeImages.length > 1 ? (
        <p className="mt-2 text-center text-xs font-semibold text-[#8a94a6] md:hidden">
          Scorri l’immagine per cambiare foto
        </p>
      ) : null}
    </div>
  );
}