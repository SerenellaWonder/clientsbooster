import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/store/add-to-cart-button";
import ContactVendorButton from "@/components/store/contact-vendor-button";
import ProductGallery from "@/components/store/product-gallery";
import type { Metadata } from "next";
import { API_URL } from "@/lib/api";

import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  store_name: string;
  store_slug: string;
  image_url?: string | null;
  category?: string | null;
  tags?: string | null;
  sku?: string | null;
  stock?: number | null;
  compare_at_price?: string | null;
  sale_price?: string | null;
};

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/public/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.product || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Prodotto non trovato",
      description: "Il prodotto richiesto non è disponibile.",
    };
  }

  const finalPrice = product.sale_price || product.price;
  const description =
    product.description ||
    `${product.title} disponibile su Clients Booster Marketplace. Prezzo: € ${finalPrice}. Venduto da ${product.store_name}.`;

  return {
    title: `${product.title} - € ${finalPrice}`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${product.title} - € ${finalPrice}`,
      description: description.slice(0, 160),
      type: "website",
      images: product.image_url
        ? [
            {
              url: product.image_url,
              width: 1200,
              height: 630,
              alt: product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} - € ${finalPrice}`,
      description: description.slice(0, 160),
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const finalPrice = product.sale_price || product.price;
  const isOutOfStock = (product.stock ?? 0) <= 0;

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-8 text-[#0b1220]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-sm font-semibold text-[#526174] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <ArrowLeft size={16} />
            Marketplace
          </Link>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-5 py-2 text-sm font-semibold text-[#0b1220] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <ShoppingBag size={16} />
            Carrello
          </Link>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-[#e6eaf2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,#ffffff,#eef3f8)] p-6 lg:p-8">
              <ProductGallery
  images={
    product.image_url
      ? [
          product.image_url,
          product.image_url,
          product.image_url,
        ]
      : ["/placeholder.png"]
  }
/>
            </div>

            <div className="p-6 lg:p-10">
              <Link
                href={`/store/${product.store_slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#cfe3ef] bg-[#e6f2f8] px-4 py-2 text-sm font-bold text-[#0d5b82]"
              >
                <Store size={16} />
                {product.store_name}
              </Link>

              {product.category ? (
                <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#0d5b82]">
                  {product.category}
                </p>
              ) : null}

              <h1 className="mt-3 text-5xl font-black leading-tight tracking-[-0.05em] text-[#071225]">
                {product.title}
              </h1>

              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Star
                    key={item}
                    size={18}
                    className="fill-[#f59e0b] text-[#f59e0b]"
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-[#526174]">
                  4.8 · 12 recensioni
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-4">
                <span className="text-4xl font-black tracking-[-0.04em] text-[#071225]">
                  € {finalPrice}
                </span>

                {product.sale_price ? (
                  <span className="pb-1 text-lg font-semibold text-[#8a94a6] line-through">
                    € {product.price}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#5b667a]">
                {product.description || "Nessuna descrizione disponibile."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-bold ${
                    isOutOfStock
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isOutOfStock ? "Esaurito" : `Stock: ${product.stock ?? 0}`}
                </span>

                {product.sku ? (
                  <span className="rounded-full border border-[#e1e7f1] bg-[#f8fafc] px-4 py-2 text-sm font-bold text-[#526174]">
                    SKU: {product.sku}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoCard icon={<Truck size={18} />} title="Spedizione" text="Gestita dal venditore" />
                <InfoCard icon={<ShieldCheck size={18} />} title="Acquisto sicuro" text="Ordine tracciato" />
                <InfoCard icon={<MessageCircle size={18} />} title="Assistenza" text="Chat venditore" />
              </div>

              <div className="mt-8 rounded-[32px] border border-[#dbe7f2] bg-gradient-to-br from-[#f0f7fc] to-[#ffffff] p-6 shadow-inner">
                <p className="mb-5 text-center text-sm font-bold uppercase tracking-[0.2em] text-[#5b667a]">
                  Azioni prodotto
                </p>

                <div className="mx-auto flex max-w-md flex-col gap-4">
                  <AddToCartButton
                    product={{
                      product_id: product.id,
                      title: product.title,
                      price: Number(product.price),
                      sale_price: product.sale_price
                        ? Number(product.sale_price)
                        : null,
                      image_url: product.image_url || null,
                      store_name: product.store_name,
                      store_slug: product.store_slug,
                    }}
                    disabled={isOutOfStock}
                  />

                 <ContactVendorButton productId={product.id} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[30px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0d5b82]">
              Venditore
            </p>

            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em]">
              {product.store_name}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#667085]">
              Contatta il venditore per disponibilità, tempi di consegna,
              dettagli prodotto o richieste personalizzate.
            </p>

            <Link
              href={`/store/${product.store_slug}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-bold text-[#0b1220] transition hover:shadow-sm"
            >
              <Store size={16} />
              Visita lo store
            </Link>
          </div>

          <div className="rounded-[30px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0d5b82]">
                  Recensioni prodotto
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em]">
                  Cosa dicono i clienti
                </h2>
              </div>

              <div className="rounded-2xl bg-[#fff7ed] px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Star
                      key={item}
                      size={15}
                      className="fill-[#f59e0b] text-[#f59e0b]"
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm font-black text-[#0b1220]">4.8/5</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ReviewCard
                name="Cliente verificato"
                text="Prodotto conforme alla descrizione e venditore disponibile nelle risposte."
              />
              <ReviewCard
                name="Acquirente marketplace"
                text="Esperienza positiva, comunicazione chiara e tempi rispettati."
              />
            </div>

            <p className="mt-5 text-xs leading-5 text-[#8a94a6]">
              Le recensioni sono una sezione dimostrativa. Il modulo recensioni
              reale potrà essere collegato agli ordini completati.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-white p-4">
      <div className="mb-3 inline-flex rounded-full bg-[#e6f2f8] p-2 text-[#0d5b82]">
        {icon}
      </div>
      <p className="text-sm font-black text-[#0b1220]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#667085]">{text}</p>
    </div>
  );
}

function ReviewCard({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-5">
      <div className="flex items-center gap-2">
        <BadgeCheck size={18} className="text-[#0d5b82]" />
        <p className="text-sm font-bold text-[#0b1220]">{name}</p>
      </div>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((item) => (
          <Star
            key={item}
            size={14}
            className="fill-[#f59e0b] text-[#f59e0b]"
          />
        ))}
      </div>

      <p className="mt-3 text-sm leading-6 text-[#667085]">{text}</p>
    </div>
  );
}