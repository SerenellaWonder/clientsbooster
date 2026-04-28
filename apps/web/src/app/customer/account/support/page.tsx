"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken, removeCustomerToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Ticket = {
  id: number;
  subject: string;
  status: string;
  requester_type: string;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["open", "in_progress", "closed"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

export default function CustomerSupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTickets() {
    try {
      const token = getCustomerToken();

      if (!token) {
        router.push("/customer/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/customers/support/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore ticket");
      }

      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
      removeCustomerToken();
      router.push("/customer/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleCreateTicket(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const token = getCustomerToken();

      if (!token) {
        router.push("/customer/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/customers/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore creazione ticket");
      }

      setSubject("");
      setMessage("");
      setShowNewTicket(false);
      setSuccess("Ticket creato correttamente");
      await loadTickets();
    } catch (err: any) {
      setError(err.message || "Errore creazione ticket");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((t) => {
      const matchSearch =
        !q ||
        String(t.id).includes(q) ||
        t.subject.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" || t.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tickets, search, statusFilter]);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento ticket...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#2f7d4b]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#0b1220]">
            Ticket
          </h1>
          <p className="mt-3 text-lg text-[#5b667a]">
            Gestisci le richieste di assistenza del tuo account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowNewTicket((prev) => !prev);
            setError("");
            setSuccess("");
          }}
          className="rounded-full bg-[#2f7d4b] px-5 py-3 text-sm font-semibold text-white"
        >
          {showNewTicket ? "Chiudi form" : "Nuovo ticket"}
        </button>
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

      {showNewTicket ? (
        <div className="mb-6 card-ui p-6">
          <h2 className="text-2xl font-black text-[#0b1220]">
            Apri nuovo ticket
          </h2>

          <form onSubmit={handleCreateTicket} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                Oggetto
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
                placeholder="Es. Problema con un ordine"
                required
              />
            </div>

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                Messaggio
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-3 min-h-[140px] w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
                placeholder="Descrivi il problema o la richiesta"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-[#2f7d4b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creazione..." : "Apri ticket"}
            </button>
          </form>
        </div>
      ) : null}

      <div className="grid gap-4 rounded-[28px] border border-[#e6eaf2] bg-white p-5 md:grid-cols-2">
        <input
          placeholder="Cerca ticket"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] px-4 py-3 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] px-4 py-3 outline-none"
        >
          <option value="all">Tutti</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0b1220]">Lista ticket</h2>
          <span className="rounded-full border border-[#dbe2ee] bg-[#fbfcff] px-3 py-1 text-sm font-semibold text-[#425066]">
            {filtered.length} risultati
          </span>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
              Nessun ticket trovato.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
              >
                <div className="mb-3 flex justify-end">
                  <Link
                    href={`/customer/account/support/${t.id}`}
                    className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#1b2435]"
                  >
                    Apri dettaglio
                  </Link>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.7fr]">
                  <div>
                    <p className="text-sm font-semibold text-[#8a94a6]">
                      Ticket #{t.id}
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0b1220]">
                      {t.subject}
                    </h3>
                    <p className="mt-1 text-sm text-[#5b667a]">
                      {t.requester_type}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Stato</p>
                    <span className="w-fit rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {t.status}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Aggiornato</p>
                    <p className="text-sm font-semibold text-[#0b1220]">
                      {formatDate(t.updated_at)}
                    </p>
                    <p className="text-xs text-[#8a94a6]">
                      Creato il {formatDate(t.created_at)}
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