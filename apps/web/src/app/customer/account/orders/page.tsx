"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCustomerToken, removeCustomerToken } from "@/lib/auth";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

function formatCurrency(value: string | number) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

export default function CustomerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    async function loadOrders() {
      const token = getCustomerToken();

      if (!token) {
        router.push("/customer/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/customers/me/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento ordini");
        }

        setOrders(data.orders || []);
      } catch (error) {
        console.error(error);
        removeCustomerToken();
        router.push("/customer/login");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        String(order.id).includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_email?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || order.payment_status === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento ordini...</div>;
  }

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#2f7d4b]">
          Clients Booster
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
          I miei ordini
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-[#5b667a]">
          Cerca, filtra e consulta tutti i tuoi ordini in un’unica pagina.
        </p>
      </div>

      <div className="mt-8 grid gap-4 rounded-[28px] border border-[#e6eaf2] bg-white p-5 md:grid-cols-3">
        <input
          type="text"
          placeholder="Cerca per ID, nome o email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        >
          <option value="all">Tutti gli stati ordine</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        >
          <option value="all">Tutti gli stati pagamento</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0b1220]">Lista ordini</h2>
          <span className="rounded-full border border-[#dbe2ee] bg-[#fbfcff] px-3 py-1 text-sm font-semibold text-[#425066]">
            {filteredOrders.length} risultati
          </span>
        </div>

        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
              Nessun ordine trovato.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/customer/account/orders/${order.id}`}
                className="block rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="mb-3 flex justify-end">
                  <span className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#1b2435]">
                    Apri dettaglio
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.7fr]">
                  <div>
                    <p className="text-sm font-semibold text-[#8a94a6]">
                      Ordine #{order.id}
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0b1220]">
                      {order.customer_name}
                    </h3>
                    <p className="mt-1 text-sm text-[#5b667a]">
                      {order.customer_email}
                    </p>
                    <p className="mt-2 text-xs text-[#8a94a6]">
                      Creato il {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Totale</p>
                    <p className="text-2xl font-black text-[#0b1220]">
                      {formatCurrency(order.total)}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <span className="w-fit rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {order.status}
                    </span>

                    <span className="w-fit rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}