"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Match = {
  tenant_id: number;
  store_name: string;
  store_slug: string;
  score: number;
  products: {
    id: number;
    title: string;
    category?: string | null;
  }[];
};

type Partnership = {
  id: number;
  requester_vendor_id: number;
  receiver_vendor_id: number;
  requester_tenant_id: number;
  receiver_tenant_id: number;
  title: string;
  message: string;
  status: string;
  sender_store_name?: string;
  receiver_store_name?: string;
  created_at: string;
};

export default function VendorPartnershipsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Token venditore mancante");

      const [matchesRes, partnershipsRes] = await Promise.all([
        fetch(`${API_URL}/api/vendor/partnerships/matches`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_URL}/api/vendor/partnerships`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      const matchesData = await matchesRes.json();
      const partnershipsData = await partnershipsRes.json();

      if (!matchesRes.ok) {
        throw new Error(matchesData.error || "Errore caricamento match");
      }

      if (!partnershipsRes.ok) {
        throw new Error(
          partnershipsData.error || "Errore caricamento partnership"
        );
      }

      setMatches(matchesData.matches || []);
      setPartnerships(partnershipsData.partnerships || []);
    } catch (err: any) {
      setError(err.message || "Errore caricamento dati");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openProposal(match: Match) {
    setSelectedMatch(match);
    setTitle(`Proposta partnership con ${match.store_name}`);
    setMessage(
      `Ciao ${match.store_name}, vorrei valutare una collaborazione commerciale tra i nostri store. Potremmo creare bundle, promozioni incrociate o iniziative comuni per aumentare visibilità e vendite.`
    );
  }

  async function sendProposal() {
    if (!selectedMatch || !title.trim() || !message.trim()) return;

    setSending(true);
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Token venditore mancante");

      const res = await fetch(`${API_URL}/api/vendor/partnerships`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_tenant_id: selectedMatch.tenant_id,
          title,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore invio proposta");
      }

      setSelectedMatch(null);
      setTitle("");
      setMessage("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore invio proposta");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Token venditore mancante");

      const res = await fetch(`${API_URL}/api/vendor/partnerships/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento partnership");
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento partnership");
    }
  }

  if (loading) {
    return (
      <div className="text-[#5b667a]">
        Caricamento partnership...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#0b1220]">
      <div className="rounded-[34px] border border-[#e6eaf2] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#25b7f3]">
          Business Matching
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
          Partnership tra venditori
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5b667a]">
          Trova store compatibili, proponi collaborazioni private, crea bundle,
          cross-selling e iniziative commerciali tra venditori del marketplace.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#25b7f3]">
                Match suggeriti
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Store compatibili
              </h2>
            </div>

            <span className="rounded-full bg-[#eef9fe] px-4 py-2 text-sm font-black text-[#0d5b82]">
              {matches.length} match
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {matches.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#dbe2ee] bg-[#fbfcff] p-6 text-sm text-[#5b667a]">
                Nessun match trovato. Aggiungi categorie e tag ai prodotti per
                migliorare il matching commerciale.
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.tenant_id}
                  className="rounded-[28px] border border-[#e6eaf2] bg-[#fbfcff] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">
                        {match.store_name}
                      </h3>

                      <p className="mt-1 text-sm text-[#5b667a]">
                        Compatibilità score:{" "}
                        <span className="font-black text-[#0d5b82]">
                          {match.score}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openProposal(match)}
                      className="rounded-full bg-[#25b7f3] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0d9ed8]"
                    >
                      Proponi partnership
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {match.products.slice(0, 4).map((product) => (
                      <span
                        key={product.id}
                        className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#334155]"
                      >
                        {product.title}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#667085]">
                    Idea Booster: valuta bundle, promozioni incrociate o
                    referral tra store se i cataloghi sono complementari.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[34px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#25b7f3]">
            Proposta privata
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Crea una partnership
          </h2>

          {selectedMatch ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#eef9fe] px-4 py-3 text-sm font-bold text-[#0d5b82]">
                Destinatario: {selectedMatch.store_name}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-[#dbe2ee] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#25b7f3]"
                placeholder="Titolo proposta"
              />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[180px] w-full rounded-2xl border border-[#dbe2ee] px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-[#25b7f3]"
                placeholder="Messaggio proposta"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={sendProposal}
                  disabled={sending}
                  className="flex-1 rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d9ed8] disabled:opacity-50"
                >
                  {sending ? "Invio..." : "Invia proposta"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="rounded-full border border-[#dbe2ee] bg-white px-5 py-3 text-sm font-bold text-[#334155]"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#dbe2ee] bg-[#fbfcff] p-6 text-sm leading-7 text-[#5b667a]">
              Seleziona uno store compatibile dalla lista match per aprire una
              proposta privata di collaborazione commerciale.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[34px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#25b7f3]">
              Inbox partnership
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Proposte inviate e ricevute
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {partnerships.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#dbe2ee] bg-[#fbfcff] p-6 text-sm text-[#5b667a]">
              Non hai ancora partnership attive o proposte in corso.
            </div>
          ) : (
            partnerships.map((item) => (
              <div
                key={item.id}
                className="rounded-[28px] border border-[#e6eaf2] bg-[#fbfcff] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black">{item.title}</h3>

                    <p className="mt-1 text-sm text-[#5b667a]">
                      Da{" "}
                      <span className="font-bold">
                        {item.sender_store_name || "Store"}
                      </span>{" "}
                      a{" "}
                      <span className="font-bold">
                        {item.receiver_store_name || "Store"}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      item.status === "accepted"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "declined"
                          ? "bg-rose-50 text-rose-700"
                          : item.status === "closed"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#5b667a]">
                  {item.message}
                </p>

                {item.status === "pending" ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateStatus(item.id, "accepted")}
                      className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white"
                    >
                      Accetta
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(item.id, "declined")}
                      className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-black text-rose-700"
                    >
                      Rifiuta
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}