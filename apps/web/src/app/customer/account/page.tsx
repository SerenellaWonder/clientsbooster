"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

type Customer = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  default_shipping_address?: string | null;
  created_at: string;
};

type Address = {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

type SupportTicket = {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

function formatCurrency(value: string | number) {
  return `€ ${Number(value || 0).toFixed(2)}`;
}

export default function CustomerAccountPage() {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [success, setSuccess] = useState("");

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileShipping, setProfileShipping] = useState("");

  const [label, setLabel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  async function loadAll() {
    const token = getCustomerToken();

    if (!token) {
      router.push("/customer/login");
      return;
    }

    const [meRes, ordersRes, addressesRes, ticketsRes] = await Promise.all([
      fetch(`${API_URL}/api/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/api/customers/me/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/api/customers/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/api/customers/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const meData = await meRes.json();
    const ordersData = await ordersRes.json();
    const addressesData = await addressesRes.json();
    const ticketsData = await ticketsRes.json();

    if (!meRes.ok) throw new Error(meData.error || "Errore profilo");
    if (!ordersRes.ok) throw new Error(ordersData.error || "Errore ordini");
    if (!addressesRes.ok) {
      throw new Error(addressesData.error || "Errore indirizzi");
    }
    if (!ticketsRes.ok) {
      throw new Error(ticketsData.error || "Errore ticket");
    }

    setCustomer(meData.customer || null);
    setOrders(ordersData.orders || []);
    setAddresses(addressesData.addresses || []);
    setTickets(ticketsData.tickets || []);

    setProfileName(meData.customer?.name || "");
    setProfilePhone(meData.customer?.phone || "");
    setProfileShipping(meData.customer?.default_shipping_address || "");
  }

  useEffect(() => {
    async function init() {
      try {
        await loadAll();
      } catch (err: any) {
        setError(err.message || "Errore caricamento area utente");
        removeCustomerToken();
        router.push("/customer/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter(
      (order) => order.payment_status === "paid"
    ).length;
    const openOrders = orders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    ).length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
    const openTickets = tickets.filter(
      (ticket) =>
        ticket.status === "open" || ticket.status === "in_progress"
    ).length;

    return {
      totalOrders,
      paidOrders,
      openOrders,
      totalSpent,
      openTickets,
    };
  }, [orders, tickets]);

  const recentOrders = orders.slice(0, 4);
  const recentTickets = tickets.slice(0, 4);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const token = getCustomerToken();
      const res = await fetch(`${API_URL}/api/customers/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          default_shipping_address: profileShipping,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento profilo");
      }

      setCustomer(data.customer);
      setSuccess("Profilo aggiornato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento profilo");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddressSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingAddress(true);
    setError("");
    setSuccess("");

    try {
      const token = getCustomerToken();
      const res = await fetch(`${API_URL}/api/customers/me/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label,
          full_name: fullName,
          phone,
          address_line: addressLine,
          city,
          postal_code: postalCode,
          country,
          is_default: isDefault,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore creazione indirizzo");
      }

      setLabel("");
      setFullName("");
      setPhone("");
      setAddressLine("");
      setCity("");
      setPostalCode("");
      setCountry("");
      setIsDefault(true);

      await loadAll();
      setSuccess("Indirizzo salvato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore creazione indirizzo");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id: number) {
    const confirmed = window.confirm("Vuoi eliminare questo indirizzo?");
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const token = getCustomerToken();
      const res = await fetch(`${API_URL}/api/customers/me/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore eliminazione indirizzo");
      }

      await loadAll();
      setSuccess("Indirizzo eliminato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore eliminazione indirizzo");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fc] text-[#0b1220]">
        <div className="text-[#5b667a]">Caricamento area utente...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#0b1220]">
      <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#245c38,#2f7d4b)] px-8 py-8 text-white shadow-[0_24px_70px_rgba(47,125,75,0.18)] md:px-10 md:py-10">  <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-50">
              Clients Booster
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
              Ciao {customer?.name || "Cliente"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 md:text-base">
              Tieni sotto controllo ordini, profilo, indirizzi e assistenza da
              un’unica dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <HeroMiniStat label="Ordini" value={stats.totalOrders} />
            <HeroMiniStat
              label="Speso"
              value={formatCurrency(stats.totalSpent)}
            />
            <HeroMiniStat
              label="Ticket aperti"
              value={stats.openTickets}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-5">
        <StatCard label="Ordini" value={stats.totalOrders} />
        <StatCard label="Pagati" value={stats.paidOrders} />
        <StatCard label="Attivi" value={stats.openOrders} />
        <StatCard label="Ticket" value={stats.openTickets} />
        <StatCard label="Speso" value={formatCurrency(stats.totalSpent)} />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Centro di controllo
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickCard
              href="/customer/account/orders"
              kicker="Acquisti"
              title="Ordini"
              text="Controlla lo stato dei tuoi ordini e il dettaglio acquisti."
            />
            <QuickCard
              href="/customer/account/support"
              kicker="Supporto"
              title="Ticket"
              text="Apri richieste di assistenza e segui le risposte."
            />
            <QuickCard
              href="/"
              kicker="Marketplace"
              title="Continua shopping"
              text="Torna al marketplace e scopri nuovi prodotti."
            />
            <QuickCard
              href="/customer/account"
              kicker="Profilo"
              title="Dati personali"
              text="Aggiorna recapiti e indirizzo di spedizione."
            />
          </div>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Focus rapido
          </h2>

          <div className="mt-6 space-y-3">
            <InfoStrip
              text="Controlla eventuali ordini ancora in lavorazione."
              highlight
            />
            <InfoStrip text="Mantieni aggiornato il tuo indirizzo predefinito." />
            <InfoStrip text="Apri un ticket se hai bisogno di supporto su ordini o account." />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card-ui p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
              Ordini recenti
            </h2>
            <Link
              href="/customer/account/orders"
              className="text-sm font-semibold text-[#2f7d4b]"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <EmptyState text="Non hai ancora effettuato ordini." />
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/customer/account/orders/${order.id}`}
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
              Ticket recenti
            </h2>
            <Link
              href="/customer/account/support"
              className="text-sm font-semibold text-[#2f7d4b]"
            >
              Vedi tutti
            </Link>
          </div>

          <div className="space-y-4">
            {recentTickets.length === 0 ? (
              <EmptyState text="Nessun ticket aperto." />
            ) : (
              recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/customer/account/support/${ticket.id}`}
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

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Modifica profilo
          </h2>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            <InputField
              label="Nome"
              value={profileName}
              onChange={setProfileName}
            />
            <InputField
              label="Telefono"
              value={profilePhone}
              onChange={setProfilePhone}
            />
            <TextareaField
              label="Indirizzo di spedizione predefinito"
              value={profileShipping}
              onChange={setProfileShipping}
            />

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-full bg-[#2f7d4b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingProfile ? "Salvataggio..." : "Salva profilo"}
            </button>
          </form>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Nuovo indirizzo
          </h2>

          <form onSubmit={handleAddressSubmit} className="mt-5 space-y-4">
            <InputField
              label="Etichetta"
              value={label}
              onChange={setLabel}
            />
            <InputField
              label="Nome completo"
              value={fullName}
              onChange={setFullName}
            />
            <InputField
              label="Telefono"
              value={phone}
              onChange={setPhone}
            />
            <InputField
              label="Via / indirizzo"
              value={addressLine}
              onChange={setAddressLine}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Città" value={city} onChange={setCity} />
              <InputField
                label="CAP"
                value={postalCode}
                onChange={setPostalCode}
              />
            </div>

            <InputField
              label="Paese"
              value={country}
              onChange={setCountry}
            />

            <label className="flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-3 text-sm text-[#334155]">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Imposta come indirizzo predefinito
            </label>

            <button
              type="submit"
              disabled={savingAddress}
              className="rounded-full bg-[#2f7d4b] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingAddress ? "Salvataggio..." : "Salva indirizzo"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
            Indirizzi salvati
          </h2>

          <div className="mt-5 space-y-4">
            {addresses.length === 0 ? (
              <EmptyState text="Nessun indirizzo salvato." />
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-[#0b1220]">
                          {address.label}
                        </p>
                        {address.is_default ? (
                          <span className="rounded-full border border-[#d7f5df] bg-[#eefbf2] px-3 py-1 text-xs font-bold text-[#2f7d4b]">
                            Predefinito
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-[#334155]">
                        {[
                          address.full_name,
                          address.phone,
                          address.address_line,
                          address.city,
                          address.postal_code,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
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
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-50">
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
  ? "rounded-2xl border border-[#cfe7d6] bg-[#eaf6ee] px-4 py-4 text-sm font-semibold text-[#2f7d4b]"
          : "rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-4 text-sm text-[#334155]"
      }
    >
      {text}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 min-h-[110px] w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
      {text}
    </div>
  );
}