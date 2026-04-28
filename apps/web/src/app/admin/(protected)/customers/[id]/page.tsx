"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getAdminToken, removeAdminToken } from "@/lib/admin-auth";

type Customer = {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  default_shipping_address?: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/admin/customers/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento cliente");
        }

        setCustomer(data.customer);
        setEmail(data.customer.email || "");
        setName(data.customer.name || "");
        setPhone(data.customer.phone || "");
        setShippingAddress(data.customer.default_shipping_address || "");
      } catch (err: any) {
        setError(err.message || "Errore caricamento cliente");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadCustomer();
    }
  }, [params, router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getAdminToken();

      const res = await fetch(`${API_URL}/api/admin/customers/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          name,
          phone,
          default_shipping_address: shippingAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento cliente");
      }

      setCustomer(data.customer);
      setSuccess("Cliente aggiornato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento cliente");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Vuoi eliminare questo cliente? Questa azione non si può annullare."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAdminToken();

      const res = await fetch(`${API_URL}/api/admin/customers/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore eliminazione cliente");
      }

      router.push("/admin/customers");
    } catch (err: any) {
      setError(err.message || "Errore eliminazione cliente");
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento cliente...</div>;
  }

  if (!customer) {
    return <div className="text-[#5b667a]">Cliente non trovato.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Cliente #{customer.id}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Modifica completa dati cliente e recapiti.
          </p>
        </div>

        <Link
          href="/admin/customers"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435]"
        >
          ← Clienti
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
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black text-[#0b1220]">
            Dati cliente
          </h2>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <InputField label="Nome" value={name} onChange={setName} />
            <InputField label="Email" value={email} onChange={setEmail} />
            <InputField label="Telefono" value={phone} onChange={setPhone} />

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                Indirizzo predefinito
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="mt-3 min-h-[110px] w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
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
                {deleting ? "Eliminazione..." : "Elimina cliente"}
              </button>
            </div>
          </form>
        </div>

        <div className="card-ui p-6">
          <h2 className="text-2xl font-black text-[#0b1220]">Riepilogo</h2>

          <div className="mt-5 space-y-4">
            <InfoBox label="ID cliente" value={`#${customer.id}`} />
            <InfoBox
              label="Creato il"
              value={formatDate(customer.created_at)}
            />
            <InfoBox label="Telefono attuale" value={phone || "—"} />
            <InfoBox label="Email attuale" value={email || "—"} />
          </div>
        </div>
      </div>
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