"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getAdminToken, removeAdminToken } from "@/lib/admin-auth";

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

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  useEffect(() => {
    async function loadOrder() {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/admin/orders/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento ordine");
        }

        setOrder(data.order);
        setItems(data.items || []);

        setCustomerName(data.order.customer_name || "");
        setCustomerEmail(data.order.customer_email || "");
        setCustomerPhone(data.order.customer_phone || "");
        setShippingAddress(data.order.shipping_address || "");
        setNotes(data.order.notes || "");
        setStatus(data.order.status || "pending");
        setPaymentStatus(data.order.payment_status || "pending");
      } catch (error) {
        console.error(error);
        removeAdminToken();
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadOrder();
    }
  }, [params, router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getAdminToken();

      const res = await fetch(`${API_URL}/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          notes,
          status,
          payment_status: paymentStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento ordine");
      }

      setOrder(data.order);
      setSuccess("Ordine aggiornato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento ordine");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!order) return;

    const confirmed = window.confirm(
      `Vuoi eliminare l'ordine #${order.id}? Questa azione non si può annullare.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAdminToken();

      const res = await fetch(`${API_URL}/api/admin/orders/${order.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore eliminazione ordine");
      }

      router.push("/admin/orders");
    } catch (err: any) {
      setError(err.message || "Errore eliminazione ordine");
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento ordine...</div>;
  }

  if (!order) {
    return <div className="text-[#5b667a]">Ordine non trovato.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Ordine #{order.id}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Modifica completa ordine e dati cliente.
          </p>
        </div>

        <Link
          href="/admin/orders"
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

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">
              Dati ordine
            </h2>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nome cliente"
                  value={customerName}
                  onChange={setCustomerName}
                />
                <Input
                  label="Email cliente"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                />
                <Input
                  label="Telefono"
                  value={customerPhone}
                  onChange={setCustomerPhone}
                />
                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
                  <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                    Data ordine
                  </label>
                  <p className="mt-2 text-base font-semibold text-[#0b1220]">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              <Textarea
                label="Indirizzo spedizione"
                value={shippingAddress}
                onChange={setShippingAddress}
              />

              <Textarea
                label="Note"
                value={notes}
                onChange={setNotes}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Stato ordine"
                  value={status}
                  onChange={setStatus}
                  options={ORDER_STATUSES}
                />

                <SelectField
                  label="Stato pagamento"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={PAYMENT_STATUSES}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#0d5b82] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva modifiche"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
                >
                  {deleting ? "Eliminazione..." : "Elimina ordine"}
                </button>
              </div>
            </form>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">
              Prodotti ordine
            </h2>

            <div className="mt-5 space-y-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
                  Nessun prodotto.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-bold text-[#0b1220]">
                          {item.title}
                        </p>
                        <p className="text-sm text-[#5b667a]">
                          Quantità: {item.quantity}
                        </p>
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
            <h2 className="text-2xl font-black text-[#0b1220]">
              Riepilogo
            </h2>

            <div className="mt-5 space-y-4">
              <InfoBox label="ID ordine" value={`#${order.id}`} />
              <InfoBox label="Stato attuale" value={status} />
              <InfoBox label="Pagamento" value={paymentStatus} />

              <div className="rounded-2xl border border-[#cfe3ef] bg-[#e6f2f8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#0d5b82]">
                  Totale ordine
                </p>
                <p className="mt-2 text-2xl font-black text-[#0b1220]">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
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

function Textarea({
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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