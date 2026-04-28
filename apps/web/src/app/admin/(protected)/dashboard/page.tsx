"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getAdminToken, removeAdminToken } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

type Overview = {
  stats: {
    vendors: number;
    admins: number;
    customers: number;
    stores: number;
    products: number;
    publishedProducts: number;
    orders: number;
  };
};

type Vendor = {
  id: number;
  email: string;
  role: string;
  created_at: string;
  tenant_id?: number | null;
  store_name?: string | null;
  store_slug?: string | null;
};

type Customer = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  default_shipping_address?: string | null;
  created_at: string;
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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    async function load() {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          overviewRes,
          vendorsRes,
          customersRes,
          ordersRes,
          ticketsRes,
        ] = await Promise.all([
          fetch(`${API_URL}/api/admin/overview`, { headers }),
          fetch(`${API_URL}/api/admin/vendors`, { headers }),
          fetch(`${API_URL}/api/admin/customers`, { headers }),
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/admin/support/tickets`, { headers }),
        ]);

        const overviewData = await overviewRes.json();
        const vendorsData = await vendorsRes.json();
        const customersData = await customersRes.json();
        const ordersData = await ordersRes.json();
        const ticketsData = await ticketsRes.json();

        if (!overviewRes.ok) {
          throw new Error(overviewData.error || "Errore overview admin");
        }
        if (!vendorsRes.ok) {
          throw new Error(vendorsData.error || "Errore vendors admin");
        }
        if (!customersRes.ok) {
          throw new Error(customersData.error || "Errore customers admin");
        }
        if (!ordersRes.ok) {
          throw new Error(ordersData.error || "Errore orders admin");
        }
        if (!ticketsRes.ok) {
          throw new Error(ticketsData.error || "Errore tickets admin");
        }

        setOverview(overviewData);
        setVendors(vendorsData.vendors || []);
        setCustomers(customersData.customers || []);
        setOrders(ordersData.orders || []);
        setTickets(ticketsData.tickets || []);
      } catch (error) {
        console.error(error);
        removeAdminToken();
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const latestVendors = vendors.slice(0, 4);
  const latestCustomers = customers.slice(0, 4);
  const latestOrders = orders.slice(0, 5);
  const latestTickets = tickets.slice(0, 5);

  const openTicketsCount = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress"
  ).length;

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();

    if (!q) {
      return {
        vendors: [] as Vendor[],
        customers: [] as Customer[],
        orders: [] as Order[],
        tickets: [] as SupportTicket[],
      };
    }

    return {
      vendors: vendors
        .filter(
          (v) =>
            String(v.id).includes(q) ||
            v.email?.toLowerCase().includes(q) ||
            v.store_name?.toLowerCase().includes(q) ||
            v.store_slug?.toLowerCase().includes(q)
        )
        .slice(0, 5),

      customers: customers
        .filter(
          (c) =>
            String(c.id).includes(q) ||
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q)
        )
        .slice(0, 5),

      orders: orders
        .filter(
          (o) =>
            String(o.id).includes(q) ||
            o.customer_name?.toLowerCase().includes(q) ||
            o.customer_email?.toLowerCase().includes(q) ||
            o.status?.toLowerCase().includes(q) ||
            o.payment_status?.toLowerCase().includes(q)
        )
        .slice(0, 5),

      tickets: tickets
        .filter(
          (t) =>
            String(t.id).includes(q) ||
            t.subject?.toLowerCase().includes(q) ||
            t.requester_type?.toLowerCase().includes(q) ||
            t.status?.toLowerCase().includes(q)
        )
        .slice(0, 5),
    };
  }, [globalSearch, vendors, customers, orders, tickets]);

  const hasSearchResults =
    searchResults.vendors.length > 0 ||
    searchResults.customers.length > 0 ||
    searchResults.orders.length > 0 ||
    searchResults.tickets.length > 0;

  if (loading) {
    return (
      <div className="text-[#5b667a]">
        Caricamento dashboard admin...
      </div>
    );
  }

  return (
    <div>
      <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0b1220,#0d5b82)] px-8 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:px-10 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">
              Clients Booster
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
              Superadmin dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-100 md:text-base">
              Tieni sotto controllo utenti, negozi, prodotti, ordini e attività
              chiave della piattaforma da un unico cruscotto operativo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100">
                Ticket aperti
              </p>
              <p className="mt-2 text-2xl font-black">{openTicketsCount}</p>
            </div>

            <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100">
                Ordini
              </p>
              <p className="mt-2 text-2xl font-black">
                {overview?.stats.orders ?? 0}
              </p>
            </div>

            <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100">
                Store
              </p>
              <p className="mt-2 text-2xl font-black">
                {overview?.stats.stores ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
          Ricerca globale admin
        </h2>
        <p className="mt-2 text-sm text-[#5b667a]">
          Cerca contemporaneamente venditori, clienti, ordini e ticket.
        </p>

        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Cerca per nome, email, ID, store, ordine o ticket"
          className="mt-5 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        />

        {globalSearch.trim() ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <SearchSection
              title="Venditori"
              emptyText="Nessun venditore trovato."
              items={searchResults.vendors.map((vendor) => ({
                href: `/admin/vendors/${vendor.id}`,
                title: vendor.store_name || `Venditore #${vendor.id}`,
                subtitle: vendor.email,
                meta: vendor.store_slug || "—",
              }))}
            />

            <SearchSection
              title="Clienti"
              emptyText="Nessun cliente trovato."
              items={searchResults.customers.map((customer) => ({
                href: `/admin/customers/${customer.id}`,
                title: customer.name || `Cliente #${customer.id}`,
                subtitle: customer.email,
                meta: customer.phone || "—",
              }))}
            />

            <SearchSection
              title="Ordini"
              emptyText="Nessun ordine trovato."
              items={searchResults.orders.map((order) => ({
                href: `/admin/orders/${order.id}`,
                title: `Ordine #${order.id}`,
                subtitle: order.customer_name,
                meta: `${order.status} · ${order.payment_status}`,
              }))}
            />

            <SearchSection
              title="Ticket"
              emptyText="Nessun ticket trovato."
              items={searchResults.tickets.map((ticket) => ({
                href: `/admin/support/${ticket.id}`,
                title: `Ticket #${ticket.id}`,
                subtitle: ticket.subject,
                meta: `${ticket.requester_type} · ${ticket.status}`,
              }))}
            />
          </div>
        ) : null}

        {globalSearch.trim() && !hasSearchResults ? (
          <div className="mt-6 rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
            Nessun risultato trovato per la ricerca inserita.
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Venditori" value={overview?.stats.vendors ?? 0} />
        <StatCard label="Admin" value={overview?.stats.admins ?? 0} />
        <StatCard label="Clienti" value={overview?.stats.customers ?? 0} />
        <StatCard label="Store" value={overview?.stats.stores ?? 0} />
        <StatCard label="Prodotti" value={overview?.stats.products ?? 0} />
        <StatCard
          label="Pubblicati"
          value={overview?.stats.publishedProducts ?? 0}
        />
        <StatCard label="Ordini" value={overview?.stats.orders ?? 0} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Centro di controllo
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickCard
              href="/admin/vendors"
              kicker="Gestione"
              title="Venditori"
              text="Controlla account, store e dati commerciali."
            />
            <QuickCard
              href="/admin/customers"
              kicker="Gestione"
              title="Clienti"
              text="Modifica profili, recapiti e dati utente."
            />
            <QuickCard
              href="/admin/orders"
              kicker="Operatività"
              title="Ordini"
              text="Verifica stati, pagamenti e storico ordini."
            />
            <QuickCard
              href="/admin/support"
              kicker="Supporto"
              title="Ticket"
              text="Gestisci richieste clienti e venditori."
            />
          </div>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Priorità admin
          </h2>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-[#cfe3ef] bg-[#e6f2f8] px-4 py-4 text-sm font-semibold text-[#0d5b82]">
              Verifica periodicamente venditori e stato store attivi.
            </div>

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-4 text-sm text-[#334155]">
              Controlla ticket aperti e richieste ancora in lavorazione.
            </div>

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-4 text-sm text-[#334155]">
              Monitora crescita clienti, prodotti pubblicati e volumi ordini.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card-ui p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
              Ultimi venditori
            </h2>
            <Link
              href="/admin/vendors"
              className="text-sm font-semibold text-[#0d5b82]"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {latestVendors.length === 0 ? (
              <EmptyState text="Nessun venditore trovato." />
            ) : (
              latestVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/admin/vendors/${vendor.id}`}
                  className="block rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#8a94a6]">
                    Venditore #{vendor.id}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#0b1220]">
                    {vendor.store_name || "Nessuno store"}
                  </h3>
                  <p className="mt-1 text-sm text-[#5b667a]">{vendor.email}</p>
                  <p className="mt-2 text-xs text-[#8a94a6]">
                    Creato il {formatDate(vendor.created_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card-ui p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
              Ultimi clienti
            </h2>
            <Link
              href="/admin/customers"
              className="text-sm font-semibold text-[#0d5b82]"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {latestCustomers.length === 0 ? (
              <EmptyState text="Nessun cliente trovato." />
            ) : (
              latestCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-[#8a94a6]">
                    Cliente #{customer.id}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#0b1220]">
                    {customer.name || "Senza nome"}
                  </h3>
                  <p className="mt-1 text-sm text-[#5b667a]">
                    {customer.email}
                  </p>
                  <p className="mt-2 text-xs text-[#8a94a6]">
                    Creato il {formatDate(customer.created_at)}
                  </p>
                </Link>
              ))
            )}
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
              href="/admin/orders"
              className="text-sm font-semibold text-[#0d5b82]"
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
                  href={`/admin/orders/${order.id}`}
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
              href="/admin/support"
              className="text-sm font-semibold text-[#0d5b82]"
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
                  href={`/admin/support/${ticket.id}`}
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
                        {ticket.requester_type}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {ticket.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#8a94a6]">
                    Aggiornato: {formatDateTime(ticket.updated_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
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

function SearchSection({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: { href: string; title: string; subtitle: string; meta: string }[];
}) {
  return (
    <div className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <h3 className="text-lg font-black text-[#0b1220]">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-[#5b667a]">{emptyText}</div>
        ) : (
          items.map((item) => (
            <Link
              key={`${title}-${item.href}`}
              href={item.href}
              className="block rounded-2xl border border-[#e6eaf2] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <p className="font-semibold text-[#0b1220]">{item.title}</p>
              <p className="mt-1 text-sm text-[#5b667a]">{item.subtitle}</p>
              <p className="mt-1 text-xs text-[#8a94a6]">{item.meta}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}