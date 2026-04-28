"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

const VENDOR_PRIMARY = "#25b7f3";

export default function ForgotPasswordVendor() {
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
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore invio email");
      }

      setSuccess("Se l’email è registrata riceverai il link di recupero.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Errore recupero password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
        
        <div className="mb-6">
          <span className="inline-flex rounded-full border border-[#d8f0fb] bg-[#ecfaff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#25b7f3]">
            Vendor Booster
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
            Recupera password
          </h1>

          <p className="mt-2 text-sm text-[#5b667a]">
            Inserisci la tua email venditore per ricevere il link di reset.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="email@store.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-[#25b7f3]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3 font-semibold text-white"
            style={{ background: VENDOR_PRIMARY }}
          >
            {loading ? "Invio..." : "Invia link reset"}
          </button>
        </form>

        <Link href="/login" className="mt-4 block text-sm text-[#25b7f3]">
          Torna al login
        </Link>
      </div>
    </main>
  );
}