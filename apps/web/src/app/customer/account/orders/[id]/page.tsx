"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCustomerToken, removeCustomerToken } from "@/lib/auth";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  title: string;
  price: string;
  quantity: number;
  image_url?: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

function formatCurrency(value: string | number) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      const token = getCustomerToken();

      if (!token) {
        router.push("/customer/login");
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/customers/me/orders/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento ordine");
        }

        setOrder(data.order);
        setItems(data.items || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Errore caricamento ordine");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadOrder();
    }
  }, [params, router]);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento ordine...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="text-[#5b667a]">Ordine non trovato.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#2f7d4b]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Ordine #{order.id}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Dettaglio completo del tuo ordine.
          </p>
        </div>

        <Link
          href="/customer/account/orders"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435]"
        >
          ← Ordini
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">
              Informazioni ordine
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoBox label="Nome" value={order.customer_name} />
              <InfoBox label="Email" value={order.customer_email} />
              <InfoBox label="Telefono" value={order.customer_phone || "—"} />
              <InfoBox label="Data ordine" value={formatDate(order.created_at)} />
              <InfoBox
                label="Indirizzo spedizione"
                value={order.shipping_address || "—"}
                full
              />
              <InfoBox label="Note" value={order.notes || "—"} full />
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">
              Prodotti ordine
            </h2>

            <div className="mt-5 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
                  Nessun prodotto presente.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e6eaf2] bg-white text-xs text-[#8a94a6]">
                            No image
                          </div>
                        )}

                        <div>
                          <p className="text-lg font-bold text-[#0b1220]">
                            {item.title}
                          </p>
                          <p className="text-sm text-[#5b667a]">
                            Quantità: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-[#5b667a]">Prezzo</p>
                        <p className="text-lg font-black text-[#0b1220]">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-[#5b667a]">
                          Totale:{" "}
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Riepilogo</h2>

            <div className="mt-5 space-y-4">
              <InfoBox label="ID ordine" value={`#${order.id}`} />
              <InfoBox label="Stato ordine" value={order.status} />
              <InfoBox
                label="Stato pagamento"
                value={order.payment_status}
              />

              <div className="rounded-2xl border border-[#cfe7d6] bg-[#eaf6ee] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#2f7d4b]">
                  Totale ordine
                </p>
                <p className="mt-2 text-2xl font-black text-[#0b1220]">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Supporto</h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#cfe7d6] bg-[#eaf6ee] px-4 py-4 text-sm font-semibold text-[#2f7d4b]">
                Hai un problema con questo ordine? Apri un ticket di assistenza.
              </div>

              <Link
                href="/customer/account/support"
                className="inline-flex rounded-full bg-[#2f7d4b] px-5 py-3 text-sm font-semibold text-white"
              >
                Vai ai ticket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#0b1220]">
        {value}
      </p>
    </div>
  );
}