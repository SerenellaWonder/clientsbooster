"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeName, email, password }),
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Risposta API non valida: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Registrazione fallita");
      }

      setSuccess("Negozio creato correttamente. Ti reindirizzo al login...");
      setStoreName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Errore registrazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Vendor Onboarding
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Apri il tuo negozio
          </h1>
          <p className="mt-3 text-slate-400">
            Crea il tuo spazio e inizia a vendere dalla dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Nome negozio
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-slate-400"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Es. Atelier Serenella"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.it"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creazione negozio..." : "Crea negozio"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Hai già un account?{" "}
          <Link href="/login" className="text-white underline">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}