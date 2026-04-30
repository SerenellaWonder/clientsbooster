"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const ADMIN_PRIMARY = "#0d5b82";

export default function ResetPasswordAdminPage() {
  return (
    <Suspense fallback={<p className="p-10">Caricamento...</p>}>
      <ResetPasswordAdmin />
    </Suspense>
  );
}

function ResetPasswordAdmin() {
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
      const res = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) throw new Error("Errore reset password");

      router.push("/admin/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="p-10">Token mancante</p>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4">
      <div className="w-full max-w-md rounded-[28px] border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-black">Nuova password</h1>

        {error ? <p className="mb-3 text-red-500">{error}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3"
          />

          <button
            className="w-full rounded-full py-3 text-white"
            style={{ background: ADMIN_PRIMARY }}
          >
            {loading ? "Salvataggio..." : "Aggiorna password"}
          </button>
        </form>
      </div>
    </main>
  );
}