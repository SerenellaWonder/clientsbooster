"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type Ticket = {
  id: number;
  requester_type: string;
  requester_id: number;
  tenant_id?: number | null;
  subject: string;
  status: "open" | "in_progress" | "closed";
  created_at: string;
  updated_at: string;
};

type Message = {
  id: number;
  sender_type: string;
  sender_id?: number | null;
  message: string;
  created_at: string;
};

type TicketDetail = {
  ticket: Ticket;
  messages: Message[];
};

const TICKET_STATUSES = ["open", "in_progress", "closed"];

function formatDate(value: string) {
  return new Date(value).toLocaleString("it-IT");
}

export default function VendorTicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<"open" | "in_progress" | "closed">("open");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTicket() {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vendor/support/tickets/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore caricamento ticket");
      }

      setDetail(data);
      setStatus(data.ticket.status);
    } catch (err: any) {
      setError(err.message || "Errore caricamento ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params?.id) {
      loadTicket();
    }
  }, [params]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const res = await fetch(
        `${API_URL}/api/vendor/support/tickets/${params.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: reply }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore invio risposta");
      }

      setDetail(data);
      setStatus(data.ticket.status);
      setReply("");
      setSuccess("Messaggio inviato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore invio risposta");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusSave() {
    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const res = await fetch(
        `${API_URL}/api/vendor/support/tickets/${params.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento stato");
      }

      setDetail((prev) =>
        prev ? { ...prev, ticket: { ...prev.ticket, status: data.ticket.status } } : prev
      );
      setSuccess("Stato ticket aggiornato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento stato");
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento ticket...</div>;
  }

  if (!detail) {
    return <div className="text-[#5b667a]">Ticket non trovato.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#25b7f3]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Ticket #{detail.ticket.id}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Gestisci la conversazione e lo stato del ticket.
          </p>
        </div>

        <Link
          href="/dashboard/support"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435]"
        >
          ← Ticket
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Dettaglio ticket</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoBox label="Oggetto" value={detail.ticket.subject} full />
              <InfoBox label="Tipo richiedente" value={detail.ticket.requester_type} />
              <InfoBox label="ID richiedente" value={String(detail.ticket.requester_id)} />
              <InfoBox label="Creato il" value={formatDate(detail.ticket.created_at)} />
              <InfoBox label="Aggiornato il" value={formatDate(detail.ticket.updated_at)} />
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Conversazione</h2>

            <div className="mt-5 space-y-4">
              {detail.messages.length === 0 ? (
                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
                  Nessun messaggio.
                </div>
              ) : (
                detail.messages.map((msg) => {
                  const isVendor = msg.sender_type === "vendor";

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-[24px] px-4 py-4 ${
                        isVendor
                          ? "ml-auto max-w-[85%] bg-[#25b7f3] text-white"
                          : "max-w-[85%] border border-[#e6eaf2] bg-[#fbfcff] text-[#0b1220]"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">
                        {msg.sender_type}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {msg.message}
                      </p>
                      <p className="mt-3 text-xs opacity-75">
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Rispondi</h2>

            <form onSubmit={handleReply} className="mt-5 space-y-4">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Scrivi un messaggio"
                className="min-h-[140px] w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
              />

              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending ? "Invio..." : "Invia messaggio"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Azioni ticket</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
                <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                  Stato ticket
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "open" | "in_progress" | "closed")
                  }
                  className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
                >
                  {TICKET_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleStatusSave}
                  disabled={savingStatus}
                  className="mt-4 rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingStatus ? "Salvataggio..." : "Salva stato"}
                </button>
              </div>

              <div className="rounded-2xl border border-[#cfeffd] bg-[#eef9fe] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#0d5b82]">
                  Stato attuale
                </p>
                <p className="mt-2 text-2xl font-black text-[#0b1220]">
                  {detail.ticket.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#0b1220]">
        {value}
      </p>
    </div>
  );
}