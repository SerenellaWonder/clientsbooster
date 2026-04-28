"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { API_URL } from "@/lib/api";

const CUSTOMER_PRIMARY = "#2f7d4b";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/api/customers/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore invio email");
      }

      setSuccess("Se l’email è registrata, riceverai il link di recupero.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Errore recupero password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-[#cfe7d6] bg-[#eaf6ee] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2f7d4b]">
              Clients Booster
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
              Recupera password
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#5b667a]">
              Inserisci la tua email cliente e ti invieremo un link per creare
              una nuova password.
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                required
                className="mt-2 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#2f7d4b]"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: CUSTOMER_PRIMARY }}
            >
              {loading ? "Invio..." : "Invia link reset"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#eef2f7] pt-5 text-sm text-[#5b667a]">
            <Link href="/customer/login" className="font-semibold text-[#2f7d4b]">
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b667a]">
        {label}
      </label>
      {children}
    </div>
  );
}