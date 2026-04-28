"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  type CartItem,
} from "@/lib/cart";

function formatCurrency(value: number) {
  return `€ ${value.toFixed(2)}`;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  function refreshCart() {
    setItems(getCart());
  }

  useEffect(() => {
    refreshCart();
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const unit = Number(item.sale_price ?? item.price ?? 0);
      return sum + unit * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10 text-[#0b1220]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[#5b667a] transition hover:text-[#0b1220]"
            >
              ← Continua lo shopping
            </Link>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
              Clients Booster
            </p>

            <h1 className="mt-2 text-5xl font-black tracking-[-0.05em]">
              Il tuo carrello
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#667085]">
              Controlla i prodotti selezionati prima di completare l’acquisto.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#e6eaf2] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f2f8] text-[#0d5b82]">
                <ShoppingBag size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a94a6]">
                  Articoli
                </p>
                <p className="text-xl font-black">{totalItems}</p>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[34px] border border-[#e6eaf2] bg-white p-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e6f2f8] text-[#0d5b82]">
              <ShoppingBag size={34} />
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em]">
              Il carrello è vuoto
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
              Aggiungi prodotti dal marketplace e torna qui per completare
              l’ordine.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-[#0d5b82] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0a4a6a]"
            >
              Scopri i prodotti
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_0.75fr]">
            <div className="space-y-4">
              {items.map((item) => {
                const unit = Number(item.sale_price ?? item.price ?? 0);
                const lineTotal = unit * Number(item.quantity || 1);

                return (
                  <article
                    key={item.product_id}
                    className="group overflow-hidden rounded-[34px] border border-[#e6eaf2] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.09)]"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="relative h-40 w-full shrink-0 overflow-hidden rounded-[26px] bg-[#eef2f7] sm:h-32 sm:w-32"
                      >
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[#94a3b8]">
                            Nessuna immagine
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d5b82]">
                              {item.store_name || "Marketplace"}
                            </p>

                            <Link href={`/products/${item.product_id}`}>
                              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#0b1220] transition hover:text-[#0d5b82]">
                                {item.title}
                              </h2>
                            </Link>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a94a6]">
                              Totale
                            </p>
                            <p className="mt-1 text-xl font-black text-[#0b1220]">
                              {formatCurrency(lineTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#667085]">
                              Quantità
                            </span>

                            <div className="flex items-center rounded-full border border-[#dbe2ee] bg-[#fbfcff] p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  updateCartItemQuantity(
                                    item.product_id,
                                    Number(item.quantity || 1) - 1
                                  );
                                  refreshCart();
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0b1220] transition hover:bg-[#eef2f7]"
                                aria-label="Diminuisci quantità"
                              >
                                <Minus size={16} />
                              </button>

                              <span className="min-w-[40px] text-center text-sm font-black">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  updateCartItemQuantity(
                                    item.product_id,
                                    Number(item.quantity || 1) + 1
                                  );
                                  refreshCart();
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0b1220] transition hover:bg-[#eef2f7]"
                                aria-label="Aumenta quantità"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="rounded-full bg-[#e6f2f8] px-4 py-2 text-sm font-black text-[#0d5b82]">
                              {formatCurrency(unit)}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                removeFromCart(item.product_id);
                                refreshCart();
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 size={15} />
                              Rimuovi
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit rounded-[34px] border border-[#e6eaf2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:sticky lg:top-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f2f8] text-[#0d5b82]">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.04em]">
                    Riepilogo
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Checkout sicuro e ordine tracciato
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-[26px] bg-[#fbfcff] p-5">
                <div className="flex justify-between text-sm text-[#667085]">
                  <span>Articoli</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between text-sm text-[#667085]">
                  <span>Subtotale</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div className="flex justify-between text-sm text-[#667085]">
                  <span>Spedizione</span>
                  <span className="font-bold text-emerald-600">Gratis</span>
                </div>

                <div className="border-t border-[#e6eaf2] pt-4">
                  <div className="flex justify-between text-2xl font-black text-[#0b1220]">
                    <span>Totale</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Link href="/checkout">
  <button className="mt-8 w-full rounded-full bg-[#0d5b82] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0a4a6a]">
    Procedi al checkout
  </button>
</Link>

              <Link
                href="/"
                className="mt-3 block w-full rounded-full border border-[#dbe2ee] bg-white px-6 py-3 text-center text-sm font-bold text-[#152033] transition hover:bg-[#f8fafc]"
              >
                Continua lo shopping
              </Link>

              <p className="mt-5 text-center text-xs leading-5 text-[#8a94a6]">
                I prodotti nel carrello sono riservati solo dopo la conferma
                dell’ordine.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}