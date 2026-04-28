"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";
import { clearCart, getCart, type CartItem } from "@/lib/cart";

type Customer = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  default_shipping_address?: string | null;
};

function formatCurrency(value: number) {
  return `€ ${value.toFixed(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittingStripe, setSubmittingStripe] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function initCheckout() {
      const token = getCustomerToken();

      if (!token) {
        router.replace("/customer/login?redirect=/checkout");
        return;
      }

      setItems(getCart());

      try {
        const res = await fetch(`${API_URL}/api/customers/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore profilo cliente");

        const customer: Customer = data.customer;
        setCustomerName(customer.name || "");
        setCustomerEmail(customer.email || "");
        setCustomerPhone(customer.phone || "");
        setShippingAddress(customer.default_shipping_address || "");
      } catch (err: any) {
        setError(err.message || "Errore caricamento checkout");
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [router]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const unitPrice = Number(item.sale_price ?? item.price ?? 0);
      return sum + unitPrice * Number(item.quantity || 1);
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }, [items]);

  async function handleClassicOrder(e: FormEvent) {
    e.preventDefault();
    setSubmittingOrder(true);
    setError("");

    try {
      if (!items.length) throw new Error("Il carrello è vuoto");
      if (!customerName.trim()) throw new Error("Inserisci il nome");
      if (!shippingAddress.trim()) throw new Error("Inserisci l’indirizzo");

      const res = await fetch(`${API_URL}/api/public/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          notes,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore checkout");

      clearCart();
      router.push(`/order-success?order_id=${data.order_id}`);
    } catch (err: any) {
      setError(err.message || "Errore checkout");
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function handleStripeCheckout() {
    setSubmittingStripe(true);
    setError("");

    try {
      if (!items.length) throw new Error("Il carrello è vuoto");
      if (!customerName.trim()) throw new Error("Inserisci il nome");
      if (!shippingAddress.trim()) throw new Error("Inserisci l’indirizzo");

      const res = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            shipping_address: shippingAddress,
            notes,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Errore Stripe checkout");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Errore Stripe checkout");
      setSubmittingStripe(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] px-6 py-10 text-[#0b1220]">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-[#e6eaf2] bg-white p-10 text-[#667085] shadow-sm">
          Caricamento checkout...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10 text-[#0b1220]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-sm font-bold text-[#526174] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <ArrowLeft size={16} />
            Torna al carrello
          </Link>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              SSL protetto
            </span>
            <span className="rounded-full bg-[#e6f2f8] px-4 py-2 text-xs font-black text-[#0d5b82]">
              Pagamento sicuro
            </span>
          </div>
        </div>

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
            Clients Booster
          </p>
          <h1 className="mt-2 text-5xl font-black tracking-[-0.05em]">
            Checkout sicuro
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#667085]">
            Completa il tuo ordine con dati di spedizione, riepilogo prodotti e
            pagamento protetto.
          </p>
        </div>

        {!items.length ? (
          <div className="rounded-[34px] border border-[#e6eaf2] bg-white p-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-black">Il carrello è vuoto</h2>
            <p className="mt-3 text-sm text-[#667085]">
              Aggiungi prodotti prima di procedere al checkout.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-[#0d5b82] px-6 py-3 text-sm font-bold text-white"
            >
              Torna al marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_0.8fr]">
            <form
              onSubmit={handleClassicOrder}
              className="rounded-[34px] border border-[#e6eaf2] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f2f8] text-[#0d5b82]">
                  <Truck size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-black tracking-[-0.04em]">
                    Spedizione
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Dati precompilati dal tuo account cliente
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <Field label="Nome completo">
                  <input
                    className="input-ui"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome e cognome"
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="input-ui cursor-not-allowed bg-[#eef2f7]"
                    value={customerEmail}
                    disabled
                    readOnly
                  />
                </Field>

                <Field label="Telefono">
                  <input
                    className="input-ui"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefono"
                  />
                </Field>

                <Field label="Indirizzo di spedizione">
                  <textarea
                    className="input-ui min-h-[120px] resize-none"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Via, città, CAP, paese"
                  />
                </Field>

                <Field label="Note ordine">
                  <textarea
                    className="input-ui min-h-[100px] resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Note facoltative per il venditore"
                  />
                </Field>
              </div>

              <div className="mt-6 rounded-[28px] border border-[#e6eaf2] bg-[#fbfcff] p-5">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-[#0d5b82]" />
                  <div>
                    <p className="text-sm font-black">Metodi di pagamento</p>
                    <p className="text-xs text-[#667085]">
                      Carte e wallet digitali tramite Stripe.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["Visa", "Mastercard", "Stripe", "Apple Pay", "Google Pay"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1.5 text-xs font-black text-[#334155]"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={submittingStripe || submittingOrder}
                  className="w-full rounded-full bg-[#635bff] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50"
                >
                  {submittingStripe ? "Reindirizzamento..." : "Paga ora con carta"}
                </button>

                <button
                  type="submit"
                  disabled={submittingStripe || submittingOrder}
                  className="w-full rounded-full border border-[#dbe2ee] bg-white px-6 py-4 text-sm font-black text-[#152033] transition hover:bg-[#f8fafc] disabled:opacity-50"
                >
                  {submittingOrder ? "Invio ordine..." : "Ordine manuale"}
                </button>
              </div>
            </form>

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
                    {totalItems} articoli nel tuo ordine
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {items.map((item) => {
                  const price = Number(item.sale_price ?? item.price ?? 0);
                  const lineTotal = price * Number(item.quantity || 1);

                  return (
                    <div
                      key={item.product_id}
                      className="flex gap-3 rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#eef2f7]">
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-[#667085]">
                          Q.tà {item.quantity}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#0d5b82]">
                          {item.store_name}
                        </p>
                      </div>

                      <p className="text-sm font-black">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[26px] bg-[#fbfcff] p-5">
                <div className="flex justify-between text-sm text-[#667085]">
                  <span>Subtotale</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div className="mt-3 flex justify-between text-sm text-[#667085]">
                  <span>Spedizione</span>
                  <span className="font-bold text-emerald-600">Gratis</span>
                </div>

                <div className="mt-4 border-t border-[#e6eaf2] pt-4">
                  <div className="flex justify-between text-2xl font-black">
                    <span>Totale</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                <LockKeyhole size={16} className="mt-0.5 shrink-0" />
                Pagamento protetto. I dati vengono gestiti dal checkout sicuro.
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}