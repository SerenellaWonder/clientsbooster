"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  title: string;
  slug: string;
  image_url?: string | null;
  price: string | number;
  store_name?: string | null;
};

export default function FeaturedProductsCarousel({
  products,
}: {
  products: Product[];
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!products?.length || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [products]);

  if (!products?.length) return null;

  const prev = () => {
    setCurrent((prev) => (prev - 1 + products.length) % products.length);
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % products.length);
  };

  return (
    <section className="py-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Prodotti in evidenza</h2>

        {products.length > 1 ? (
          <div className="flex gap-2 md:hidden">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white"
              aria-label="Precedente"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white"
              aria-label="Successivo"
            >
              →
            </button>
          </div>
        ) : null}
      </div>

      <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="md:hidden">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-full shrink-0">
                <ProductCard product={product} mobile />
              </div>
            ))}
          </div>
        </div>

        {products.length > 1 ? (
          <div className="mt-4 flex justify-center gap-2">
            {products.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2.5 w-2.5 rounded-full ${
                  current === index ? "bg-white" : "bg-white/30"
                }`}
                aria-label={`Vai alla slide ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  mobile = false,
}: {
  product: Product;
  mobile?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        mobile ? "mx-auto max-w-sm" : ""
      }`}
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Nessuna immagine
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
          {product.title}
        </h3>

        {product.store_name ? (
          <p className="text-sm text-gray-500">{product.store_name}</p>
        ) : null}

        <p className="text-lg font-bold text-gray-900">€ {product.price}</p>
      </div>
    </Link>
  );
}
