"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const VENDOR_PRIMARY = "#25b7f3";

export default function ResetPasswordVendorPage() {
  return (
    <Suspense fallback={<main className="p-10">Caricamento...</main>}>
      <ResetPasswordVendor />
    </Suspense>
  );
}

function ResetPasswordVendor() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore reset password");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Errore reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="p-10">
        <p>Token non valido</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-black">Nuova password</h1>

        {error ? (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-[#25b7f3]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full py-3 font-semibold text-white disabled:opacity-50"
            style={{ background: VENDOR_PRIMARY }}
          >
            {loading ? "Salvataggio..." : "Aggiorna password"}
          </button>
        </form>
      </div>
    </main>
  );
}