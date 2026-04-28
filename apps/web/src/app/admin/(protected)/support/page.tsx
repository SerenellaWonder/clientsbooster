"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getAdminToken, removeAdminToken } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

type Ticket = {
  id: number;
  subject: string;
  status: "open" | "in_progress" | "closed";
  requester_type: string;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

export default function AdminTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      const token = getAdminToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        const url = status
          ? `${API_URL}/api/admin/support/tickets?status=${status}`
          : `${API_URL}/api/admin/support/tickets`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("ADMIN TICKETS DATA:", data);

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento ticket");
        }

        setTickets(data.tickets || []);
      } catch (error) {
        console.error(error);
        removeAdminToken();
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [status, router]);

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
          Clients Booster
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
          Ticket supporto
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-[#5b667a]">
          Controlla e gestisci le richieste di assistenza di clienti e venditori.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {["", "open", "in_progress", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              status === s
                ? "bg-[#0d5b82] text-white"
                : "bg-white text-[#0b1220]"
            }`}
          >
            {s || "Tutti"}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-[#5b667a]">
        Ticket trovati: {tickets.length}
      </p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="card-ui p-4 text-[#5b667a]">
            Caricamento ticket...
          </div>
        ) : tickets.length === 0 ? (
          <div className="card-ui p-4 text-[#5b667a]">
            Nessun ticket trovato per questo filtro.
          </div>
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="card-ui p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#0b1220]">
                    #{t.id} — {t.subject}
                  </p>
                  <p className="mt-1 text-sm text-[#5b667a]">
                    {t.requester_type} • creato il {formatDate(t.created_at)}
                  </p>
                  <p className="mt-1 text-xs text-[#8a94a6]">
                    aggiornato: {formatDate(t.updated_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#425066]">
                    {t.status}
                  </span>

                  <Link
                    href={`/admin/support/${t.id}`}
                    className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#1b2435]"
                  >
                    Apri
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}