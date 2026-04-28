"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

const ADMIN_PRIMARY = "#0d5b82";

export default function ForgotPasswordAdmin() {
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
      const res = await fetch(`${API_URL}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Errore invio email");

      setSuccess("Email di recupero inviata");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-[28px] border shadow-sm">
        <h1 className="text-2xl font-black mb-4">Recupera password admin</h1>

        {error && <p className="text-red-500 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border px-4 py-3 rounded-xl"
          />

          <button
            className="w-full py-3 rounded-full text-white"
            style={{ background: ADMIN_PRIMARY }}
          >
            {loading ? "Invio..." : "Invia link reset"}
          </button>
        </form>

        <Link href="/admin/login" className="block mt-4 text-sm text-[#0d5b82]">
          Torna al login
        </Link>
      </div>
    </main>
  );
}