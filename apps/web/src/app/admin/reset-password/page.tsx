"use client";

import { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const ADMIN_PRIMARY = "#0d5b82";

export default function ResetPasswordAdmin() {
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
    <main className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-[28px] border shadow-sm">
        <h1 className="text-2xl font-black mb-4">Nuova password</h1>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border px-4 py-3 rounded-xl"
          />

          <button
            className="w-full py-3 rounded-full text-white"
            style={{ background: ADMIN_PRIMARY }}
          >
            {loading ? "Salvataggio..." : "Aggiorna password"}
          </button>
        </form>
      </div>
    </main>
  );
}