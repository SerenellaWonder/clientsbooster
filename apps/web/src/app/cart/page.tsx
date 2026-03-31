"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCart,
  getCartTotal,
  removeFromCart,
  updateCartItemQuantity,
  type CartItem,
} from "@/lib/cart";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  function refreshCart() {
    setItems(getCart());
  }

  useEffect(() => {
    refreshCart();
  }, []);

  const total = getCartTotal();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← Continua lo shopping
          </Link>

          <h1 className="text-3xl font-semibold">Carrello</h1>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-slate-300">Il carrello è vuoto.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-4">
              {items.map((item) => {
                const unit = item.sale_price ?? item.price;

                return (
                  <div
                    key={item.product_id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white/5">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-slate-400">{item.store_name}</p>
                        <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>

                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <span className="text-lg font-semibold">€ {unit}</span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                updateCartItemQuantity(
                                  item.product_id,
                                  item.quantity - 1
                                );
                                refreshCart();
                              }}
                              className="rounded-lg border px-3 py-1"
                            >
                              -
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              onClick={() => {
                                updateCartItemQuantity(
                                  item.product_id,
                                  item.quantity + 1
                                );
                                refreshCart();
                              }}
                              className="rounded-lg border px-3 py-1"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              removeFromCart(item.product_id);
                              refreshCart();
                            }}
                            className="rounded-lg border border-red-400 px-3 py-1 text-red-300"
                          >
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Riepilogo</h2>

              <div className="mt-6 flex items-center justify-between text-slate-300">
                <span>Totale articoli</span>
                <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xl font-semibold">
                <span>Totale</span>
                <span>€ {total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-xl bg-white px-6 py-3 text-center text-black"
              >
                Procedi al checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}