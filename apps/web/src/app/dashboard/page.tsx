"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type VendorMe = {
  email: string;
  role: string;
  store_name: string;
  store_slug: string;
};

type DashboardData = {
  stats: {
    products: number;
    publishedProducts: number;
    orders: number;
  };
};

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};

type SupportTicket = {
  id: number;
  subject: string;
  status: "open" | "in_progress" | "closed";
  requester_type: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

function formatCurrency(value: string | number) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();

        const [vendorData, dashboardData, ordersRes, ticketsRes] =
          await Promise.all([
            apiFetch("/api/vendor/me"),
            apiFetch("/api/vendor/dashboard"),
            fetch(`${API_URL}/api/vendor/orders`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${API_URL}/api/vendor/support/tickets`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const ordersData = await ordersRes.json();
        const ticketsData = await ticketsRes.json();

        if (!ordersRes.ok) {
          throw new Error(ordersData.error || "Errore ordini venditore");
        }

        if (!ticketsRes.ok) {
          throw new Error(ticketsData.error || "Errore ticket venditore");
        }

        setVendor(vendorData);
        setDashboard(dashboardData);
        setOrders(ordersData.orders || []);
        setTickets(ticketsData.tickets || []);
      } catch (error) {
        console.error(error);
        removeToken();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;

    const paidOrders = orders.filter(
      (order) => order.payment_status === "paid"
    );

    const paidOrdersCount = paidOrders.length;

    const pendingOrdersCount = orders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    ).length;

    const completedOrdersCount = orders.filter(
      (order) => order.status === "completed"
    ).length;

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const averageOrderValue =
      paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

    const openTicketsCount = tickets.filter(
      (ticket) => ticket.status === "open" || ticket.status === "in_progress"
    ).length;

    return {
      totalOrders,
      paidOrdersCount,
      pendingOrdersCount,
      completedOrdersCount,
      totalRevenue,
      averageOrderValue,
      openTicketsCount,
    };
  }, [orders, tickets]);

  const latestOrders = orders.slice(0, 5);
  const latestTickets = tickets.slice(0, 4);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento dashboard...</div>;
  }

  return (
    <div>
      <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0ea5e9,#25b7f3)] px-8 py-8 text-white shadow-[0_24px_70px_rgba(14,165,233,0.18)] md:px-10 md:py-10">  <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">  Clients Booster
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
              Ciao {vendor?.store_name || "Venditore"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 md:text-base">
              Monitora catalogo, vendite, ticket e andamento operativo del tuo
              negozio da un’unica dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <HeroMiniStat
              label="Ricavi"
              value={formatCurrency(analytics.totalRevenue)}
            />
            <HeroMiniStat
              label="Ordini attivi"
              value={analytics.pendingOrdersCount}
            />
            <HeroMiniStat
              label="Ticket aperti"
              value={analytics.openTicketsCount}
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-7">
        <StatCard
          label="Prodotti"
          value={dashboard?.stats.products ?? 0}
        />
        <StatCard
          label="Pubblicati"
          value={dashboard?.stats.publishedProducts ?? 0}
        />
        <StatCard label="Ordini" value={analytics.totalOrders} />
        <StatCard label="Pagati" value={analytics.paidOrdersCount} />
        <StatCard label="Completati" value={analytics.completedOrdersCount} />
        <StatCard
          label="Ticket aperti"
          value={analytics.openTicketsCount}
        />
        <StatCard
          label="AOV"
          value={formatCurrency(analytics.averageOrderValue)}
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Centro di controllo
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickCard
              href="/dashboard/products"
              kicker="Catalogo"
              title="Prodotti"
              text="Gestisci prodotti, pubblicazione e visibilità."
            />
            <QuickCard
              href="/dashboard/orders"
              kicker="Vendite"
              title="Ordini"
              text="Controlla stati, pagamenti e storico ordini."
            />
            <QuickCard
              href="/dashboard/support"
              kicker="Supporto"
              title="Ticket"
              text="Segui richieste aperte e risposte in corso."
            />
            <QuickCard
              href={`/store/${vendor?.store_slug || ""}`}
              kicker="Store"
              title="Vetrina pubblica"
              text="Apri il tuo negozio pubblico nel marketplace."
            />
          </div>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Analytics rapide
          </h2>

          <div className="mt-6 space-y-3">
            <InfoStrip text={`Ordini totali: ${analytics.totalOrders}`} />
            <InfoStrip
              text={`Ordini in lavorazione: ${analytics.pendingOrdersCount}`}
              highlight
            />
            <InfoStrip
              text={`Ricavo totale incassato: ${formatCurrency(
                analytics.totalRevenue
              )}`}
            />
            <InfoStrip
              text={`Valore medio ordine: ${formatCurrency(
                analytics.averageOrderValue
              )}`}
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card-ui p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
              Ultimi ordini
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-indigo-700"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {latestOrders.length === 0 ? (
              <EmptyState text="Nessun ordine trovato." />
            ) : (
              latestOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="block rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#8a94a6]">
                        Ordine #{order.id}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#0b1220]">
                        {order.customer_name}
                      </h3>
                      <p className="mt-1 text-sm text-[#5b667a]">
                        {order.customer_email}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-[#0b1220]">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-[#8a94a6]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {order.status}
                    </span>
                    <span className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {order.payment_status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card-ui p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
              Ultimi ticket
            </h2>
            <Link
              href="/dashboard/support"
              className="text-sm font-semibold text-indigo-700"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {latestTickets.length === 0 ? (
              <EmptyState text="Nessun ticket trovato." />
            ) : (
              latestTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className="block rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#8a94a6]">
                        Ticket #{ticket.id}
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#0b1220]">
                        {ticket.subject}
                      </h3>
                      <p className="mt-1 text-sm text-[#5b667a]">
                        {ticket.status}
                      </p>
                    </div>

                    <p className="text-xs text-[#8a94a6]">
                      {formatDateTime(ticket.updated_at)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Dati negozio
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoBox label="Email" value={vendor?.email || "—"} />
            <InfoBox label="Ruolo" value={vendor?.role || "—"} />
            <InfoBox
              label="Store"
              value={vendor?.store_name || "—"}
            />
            <InfoBox
              label="Slug"
              value={vendor?.store_slug || "—"}
            />
          </div>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Focus operativo
          </h2>

          <div className="mt-6 space-y-3">
            <InfoStrip
              text="Controlla gli ordini appena ricevuti e aggiorna gli stati."
              highlight
            />
            <InfoStrip text="Mantieni il catalogo pubblicato e aggiornato." />
            <InfoStrip text="Rispondi rapidamente ai ticket ancora aperti." />
            <InfoStrip text="Monitora il valore medio ordine per capire l’andamento del negozio." />
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroMiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-indigo-100">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-ui p-5">
      <p className="text-sm text-[#5b667a]">{label}</p>
      <h3 className="mt-3 text-3xl font-black">{value}</h3>
    </div>
  );
}

function QuickCard({
  href,
  kicker,
  title,
  text,
}: {
  href: string;
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#5b667a]">
        {kicker}
      </p>
      <h3 className="mt-3 text-xl font-black text-[#0b1220]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5b667a]">{text}</p>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
      {text}
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#0b1220]">
        {value}
      </p>
    </div>
  );
}

function InfoStrip({
  text,
  highlight,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-[#cfeffd] bg-[#eef9fe] px-4 py-4 text-sm font-semibold text-[#0d5b82]"
          : "rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-4 text-sm text-[#334155]"
      }
    >
      {text}
    </div>
  );
}