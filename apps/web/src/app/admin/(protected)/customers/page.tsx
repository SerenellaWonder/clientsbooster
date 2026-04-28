"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getAdminToken, removeAdminToken } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

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

export default function AdminCustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/admin/customers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento clienti");
        }

        setCustomers(data.customers || []);
      } catch {
        removeAdminToken();
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, [router]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter((customer) => {
      return (
        !q ||
        customer.name?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q) ||
        customer.phone?.toLowerCase().includes(q) ||
        String(customer.id).includes(q)
      );
    });
  }, [customers, search]);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento clienti...</div>;
  }

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
          Clients Booster
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
          Clienti
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-[#5b667a]">
          Cerca, controlla e gestisci rapidamente i clienti della piattaforma.
        </p>
      </div>

      <div className="mt-8 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <input
          type="text"
          placeholder="Cerca per nome, email, telefono o ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        />
      </div>

      <div className="mt-6 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0b1220]">Lista clienti</h2>
          <span className="rounded-full border border-[#dbe2ee] bg-[#fbfcff] px-3 py-1 text-sm font-semibold text-[#425066]">
            {filteredCustomers.length} risultati
          </span>
        </div>

        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
              Nessun cliente trovato.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
              >
                <div className="mb-3 flex justify-end">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#1b2435]"
                  >
                    Apri dettaglio
                  </Link>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.7fr]">
                  <div>
                    <p className="text-sm font-semibold text-[#8a94a6]">
                      Cliente #{customer.id}
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0b1220]">
                      {customer.name || "Senza nome"}
                    </h3>
                    <p className="mt-1 text-sm text-[#5b667a]">
                      {customer.email}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Telefono</p>
                    <p className="text-lg font-black text-[#0b1220]">
                      {customer.phone || "—"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Creato il</p>
                    <p className="text-lg font-black text-[#0b1220]">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}