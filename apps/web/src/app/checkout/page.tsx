"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { clearCart, getCart, getCartTotal, type CartItem } from "@/lib/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cart = getCart();
    setItems(cart);

    if (cart.length === 0) {
      router.push("/cart");
    }
  }, [router]);

  const total = getCartTotal();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/public/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          notes,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore checkout");
      }

      clearCart();
      router.push(`/order-success?order_id=${data.order_id}`);
    } catch (err: any) {
      setError(err.message || "Errore checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/cart" className="text-slate-400 hover:text-white">
            ← Torna al carrello
          </Link>

          <h1 className="text-3xl font-semibold">Checkout</h1>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-2xl font-semibold">Dati cliente</h2>

            <div className="mt-6 space-y-4">
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                placeholder="Nome e cognome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />

              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                placeholder="Telefono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                placeholder="Indirizzo di spedizione completo"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />

              <textarea
                className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                placeholder="Note ordine"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-white px-6 py-3 text-black disabled:opacity-50"
            >
              {loading ? "Invio ordine..." : "Conferma ordine"}
            </button>
          </form>

          <div className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Riepilogo ordine</h2>

            <div className="mt-6 space-y-3">
              {items.map((item) => {
                const unit = item.sale_price ?? item.price;
                return (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between gap-3 text-sm text-slate-300"
                  >
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>€ {(unit * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xl font-semibold">
              <span>Totale</span>
              <span>€ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}