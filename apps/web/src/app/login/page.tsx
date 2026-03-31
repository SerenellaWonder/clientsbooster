"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Risposta API non valida: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("Token mancante nella risposta");
      }

      setToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Errore login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Vendor Area
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Accedi alla dashboard
          </h1>
          <p className="mt-3 text-slate-400">
            Gestisci prodotti, ordini e crescita del tuo negozio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white text-slate-950 px-4 py-3 font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Non hai ancora un negozio?{" "}
          <Link href="/register" className="text-white underline">
            Registrati
          </Link>
        </p>
      </div>
    </main>
  );
}