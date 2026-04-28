"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function VendorLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore login venditore");
      }

      setToken(data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Errore login venditore");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-[#cfeffd] bg-[#eef9fe] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#25b7f3]">
              Clients Booster
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
              Login venditore
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#5b667a]">
              Accedi alla tua dashboard per gestire store, prodotti, ordini e ticket.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
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
                className="mt-2 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#25b7f3]"
              />
            </Field>

            <Field label="Password">
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Inserisci la password"
    required
    className="mt-2 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#25b7f3]"
  />
</Field>

<div className="flex justify-end">
  <Link
    href="/forgot-password"
    className="text-sm font-semibold text-[#25b7f3]"
  >
    Password dimenticata?
  </Link>
</div>

<button
  type="submit"
  disabled={loading}
  className="mt-2 w-full rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
>
  {loading ? "Accesso..." : "Accedi"}
</button>
          </form>

          <div className="mt-5 border-t border-[#eef2f7] pt-5 text-sm text-[#5b667a]">
            Non hai ancora un account?{" "}
            <Link href="/register" className="font-semibold text-[#25b7f3]">
              Registrati
            </Link>
          </div>

          <div className="mt-3 text-sm text-[#5b667a]">
            <Link href="/" className="font-semibold text-[#25b7f3]">
              Torna al marketplace
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