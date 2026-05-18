"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Search, Sparkles } from "lucide-react";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  sale_price?: string | null;
  image_url?: string | null;
  store_name: string;
  store_slug: string;
  category?: string | null;
  tags?: string | null;
};

export default function AiProductSearch({
  products,
}: {
  products: Product[];
}) {
  const [query, setQuery] = useState("");

  const [searched, setSearched] =
    useState(false);

  const [visible, setVisible] =
    useState(false);

  const results = useMemo(() => {
    const raw = query.toLowerCase().trim();

    if (!raw) return [];

    const words = raw
      .replace(/[^\w\sàèéìòù]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "cerco",
            "cerca",
            "aiuti",
            "aiutami",
            "trovare",
            "voglio",
            "vorrei",
            "una",
            "uno",
            "per",
            "con",
            "che",
            "hai",
            "avete",
            "prodotto",
            "prodotti",
          ].includes(word)
      );

    return products
      .map((product) => {
        const haystack = [
          product.title,
          product.description,
          product.category,
          product.tags,
          product.store_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        let score = 0;

        words.forEach((word) => {
          if (haystack.includes(word))
            score += 2;

          if (
            product.title
              .toLowerCase()
              .includes(word)
          )
            score += 3;

          if (
            (product.category || "")
              .toLowerCase()
              .includes(word)
          )
            score += 2;
        });

        return {
          product,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.product);
  }, [query, products]);

  const smartSuggestions = useMemo(() => {
    const raw = query.toLowerCase().trim();

    if (raw.length < 2 || searched)
      return [];

    const suggestions = [
      "Cravatte eleganti",
      "Cravatte a pallini",
      "Abiti da cerimonia",
      "Prodotti in offerta",
      "Moto disponibili",
      "Accessori uomo",
      "Idee regalo",
      "Store più attivi",
    ];

    return suggestions
      .filter((item) =>
        item.toLowerCase().includes(raw)
      )
      .slice(0, 4);
  }, [query, searched]);

  const aiRecommendedProducts = useMemo(() => {
    const boosted = [...products];

    return boosted
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.sale_price) scoreA += 4;
        if (b.sale_price) scoreB += 4;

        if (a.image_url) scoreA += 2;
        if (b.image_url) scoreB += 2;

        if (a.category) scoreA += 1;
        if (b.category) scoreB += 1;

        return scoreB - scoreA;
      })
      .slice(0, 4);
  }, [products]);

  useEffect(() => {
    if (!query.trim()) {
      setVisible(false);
      setSearched(false);
    }
  }, [query]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSearched(true);

    setVisible(true);
  }

  return (
    <div className="mt-10 max-w-4xl">
      <div className="rounded-[32px] border border-[#d8e7f1] bg-white p-3 shadow-[0_20px_60px_rgba(13,91,130,0.10)]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 md:flex-row"
        >
          <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-[24px] bg-[#f4f8fc] px-5">
            <Sparkles
              size={22}
              className="shrink-0 text-[#25b7f3]"
            />

            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);

                setSearched(false);
              }}
              placeholder="Descrivi cosa stai cercando..BoosterAI ti aiuta a trovarlo!"
              className="w-full bg-transparent text-base font-semibold text-[#0b1220] outline-none placeholder:text-[#8a94a6] md:text-lg"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-[#0d5b82] px-7 py-4 text-sm font-black text-white transition hover:bg-[#0a4a6a]"
          >
            <Search size={18} />
            Cerca con AI
          </button>
        </form>
      </div>

      {smartSuggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {smartSuggestions.map(
            (suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);

                  setSearched(true);

                  setVisible(true);
                }}
                className="rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-xs font-bold text-[#334155] shadow-sm transition hover:bg-[#f4f8fc]"
              >
                ✨ {suggestion}
              </button>
            )
          )}
        </div>
      ) : null}

      {searched && visible ? (
        <>
          <div className="mt-5 rounded-[28px] border border-[#e6eaf2] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0d5b82]">
                Risultati AI
              </p>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#e6f2f8] px-3 py-1 text-xs font-black text-[#0d5b82]">
                  {results.length} trovati
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setVisible(false);

                    setSearched(false);

                    setQuery("");
                  }}
                  className="text-sm font-black text-[#94a3b8] transition hover:text-[#475569]"
                  aria-label="Chiudi risultati"
                >
                  ✕
                </button>
              </div>
            </div>

            {results.length === 0 ? (
              <p className="text-sm leading-6 text-[#667085]">
                Non ho trovato prodotti
                adatti. Prova con una
                descrizione più semplice,
                ad esempio “cravatta”,
                “abito”, “moto” o
                “scarpe”.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="flex gap-4 rounded-[22px] border border-[#e6eaf2] bg-[#fbfcff] p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#eef2f7]">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[#94a3b8]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-black text-[#0b1220]">
                        {product.title}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-[#0d5b82]">
                        {product.store_name}
                      </p>

                      <p className="mt-2 text-sm font-black text-[#0b1220]">
                        €{" "}
                        {product.sale_price ||
                          product.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[28px] border border-[#dbe2ee] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0d5b82]">
                  Booster AI
                </p>

                <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
                  Consigliati per te
                </h3>
              </div>

              <div className="rounded-full bg-[#e6f2f8] px-4 py-2 text-xs font-black text-[#0d5b82]">
                AI Discovery
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {aiRecommendedProducts.map(
                (product) => (
                  <Link
                    key={`ai-${product.id}`}
                    href={`/products/${product.id}`}
                    className="group flex gap-4 rounded-[24px] border border-[#e6eaf2] bg-white p-3 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#eef2f7]">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[#94a3b8]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#eef9fe] px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#25b7f3]">
                          AI Pick
                        </span>

                        {product.category ? (
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b]">
                            {product.category}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm font-black text-[#0b1220]">
                        {product.title}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-[#0d5b82]">
                        {product.store_name}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-base font-black text-[#0b1220]">
                          €{" "}
                          {product.sale_price ||
                            product.price}
                        </p>

                        {product.sale_price ? (
                          <span className="rounded-full bg-[#eaf6ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7d4b]">
                            Offerta
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}