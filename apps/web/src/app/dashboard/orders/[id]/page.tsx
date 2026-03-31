"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/header";
import { apiFetch } from "@/lib/api";
import { removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  notes: string;
  total: string;
  status: string;
  payment_status: string;
};

type OrderItem = {
  id: number;
  title: string;
  price: string;
  quantity: number;
  image_url?: string | null;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrder() {
    try {
      const data = await apiFetch(`/api/vendor/orders/${params.id}`);
      setOrder(data.order);
      setItems(data.items || []);
      setStatus(data.order?.status || "");
      setPaymentStatus(data.order?.payment_status || "");
    } catch {
      removeToken();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params?.id) {
      loadOrder();
    }
  }, [params?.id]);

  async function handleUpdate() {
    setMessage("");

    await apiFetch(`/api/vendor/orders/${params.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        payment_status: paymentStatus,
      }),
    });

    setMessage("Ordine aggiornato correttamente");
    await loadOrder();
  }

  if (loading) {
    return <div className="text-slate-400">Caricamento ordine...</div>;
  }

  if (!order) {
    return <div className="text-slate-400">Ordine non trovato</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/dashboard/orders" className="text-sm text-slate-400 hover:text-white">
          ← Torna agli ordini
        </Link>
      </div>

      <DashboardHeader
        title={`Ordine #${order.id}`}
        subtitle="Dettaglio e gestione ordine"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Dati cliente</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nome</p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {order.customer_name}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {order.customer_email}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Telefono</p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {order.customer_phone || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Indirizzo</p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {order.shipping_address}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Note</p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {order.notes || "-"}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-semibold text-white">Articoli ordine</h2>

          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Quantità: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right font-semibold text-white">
                    € {item.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Stato ordine</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Stato ordine
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending" className="text-black">pending</option>
                <option value="processing" className="text-black">processing</option>
                <option value="shipped" className="text-black">shipped</option>
                <option value="completed" className="text-black">completed</option>
                <option value="cancelled" className="text-black">cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Stato pagamento
              </label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="pending" className="text-black">pending</option>
                <option value="paid" className="text-black">paid</option>
                <option value="failed" className="text-black">failed</option>
                <option value="refunded" className="text-black">refunded</option>
              </select>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
              <p className="text-sm text-cyan-100">Totale ordine</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                € {order.total}
              </p>
            </div>

            {message ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <button
              onClick={handleUpdate}
              className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
            >
              Salva aggiornamenti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}