"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import { apiFetch } from "@/lib/api";
import { removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const data = await apiFetch("/api/vendor/orders");
      setOrders(data.orders || []);
    } catch {
      removeToken();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div>
      <DashboardHeader
        title="Ordini"
        subtitle="Gestisci gli ordini ricevuti dal tuo negozio"
      />

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
        {loading ? (
          <p className="text-slate-400">Caricamento ordini...</p>
        ) : orders.length === 0 ? (
          <p className="text-slate-400">Nessun ordine ricevuto.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block rounded-[1.75rem] border border-white/10 bg-black/20 p-5 transition hover:bg-white/5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Ordine #{order.id}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {order.customer_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {order.customer_email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                      {order.status}
                    </span>

                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      pagamento: {order.payment_status}
                    </span>

                    <span className="text-lg font-semibold text-white">
                      € {order.total}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}